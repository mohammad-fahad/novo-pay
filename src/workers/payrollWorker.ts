import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { type PayrollJobData, type PayrollJobResult } from "../services/payrollService.js";
import { runTransferLogic } from "../services/transferService.js";
import { toMoney } from "../utils/decimal.js";

type FailedTransferError = Error & { failedTransferIndex?: number };

const PAYROLL_QUEUE = "payroll-queue";

const payrollWorker = new Worker<PayrollJobData, PayrollJobResult>(
  PAYROLL_QUEUE,
  async (job: Job<PayrollJobData, PayrollJobResult>): Promise<PayrollJobResult> => {
    const { transfers } = job.data;

    for (let i = 0; i < transfers.length; i += 1) {
      const transfer = transfers[i];
      try {
        await runTransferLogic(
          transfer.fromAccountId,
          transfer.toAccountId,
          toMoney(transfer.amount),
          transfer.idempotencyKey,
          transfer.quoteId,
          "PAYROLL",
        );
      } catch (error: unknown) {
        const transferError = (error instanceof Error
          ? error
          : new Error("Payroll transfer failed")) as FailedTransferError;
        transferError.failedTransferIndex = i;
        throw transferError;
      }
    }

    return { success: true, processed: transfers.length };
  },
  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 5 * 60 * 1000,
  },
);

payrollWorker.on("completed", (job, result) => {
  console.log(`Payroll batch [job ${job?.id}] completed:`, result);
});

payrollWorker.on("failed", (job, error) => {
  console.error(`Payroll batch [job ${job?.id}] failed:`, error);
});

process.on("SIGINT", async () => {
  console.log("Shutting down payroll worker...");
  await payrollWorker.close();
  process.exit(0);
});
