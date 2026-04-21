import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "../config/redis";
import { type PayrollJobData, type PayrollJobResult } from "../services/payrollService";
import { runTransferLogic } from "../services/transferService";
import { toMoney } from "../utils/decimal";

const PAYROLL_QUEUE = "payroll-queue";

const payrollWorker = new Worker<PayrollJobData, PayrollJobResult>(
  PAYROLL_QUEUE,
  async (job: Job<PayrollJobData, PayrollJobResult>): Promise<PayrollJobResult> => {
    const { transfers } = job.data;
    let failed = 0;
    const total = transfers.length;

    await job.updateProgress({ total, processed: 0, failed });

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
        failed += 1;
        const transferError = error instanceof Error ? error : new Error("Payroll transfer failed");
        console.error("[PAYROLL_WORKER] transfer failed", {
          jobId: job.id,
          index: i,
          fromAccountId: transfer.fromAccountId,
          toAccountId: transfer.toAccountId,
          idempotencyKey: transfer.idempotencyKey,
          message: transferError.message,
        });
      }

      await job.updateProgress({ total, processed: i + 1, failed });
    }

    return { success: true, processed: transfers.length, failed };
  },
  {
    connection: getRedisConnection(),
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
