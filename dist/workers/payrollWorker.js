import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { runTransferLogic } from "../services/transferService.js";
import { toMoney } from "../utils/decimal.js";
const PAYROLL_QUEUE = "payroll-queue";
const payrollWorker = new Worker(PAYROLL_QUEUE, async (job) => {
    const { transfers } = job.data;
    for (let i = 0; i < transfers.length; i += 1) {
        const transfer = transfers[i];
        try {
            await runTransferLogic(transfer.fromAccountId, transfer.toAccountId, toMoney(transfer.amount), transfer.idempotencyKey, transfer.quoteId, "PAYROLL");
        }
        catch (error) {
            const transferError = (error instanceof Error
                ? error
                : new Error("Payroll transfer failed"));
            transferError.failedTransferIndex = i;
            throw transferError;
        }
    }
    return { success: true, processed: transfers.length };
}, {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 5 * 60 * 1000,
});
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
