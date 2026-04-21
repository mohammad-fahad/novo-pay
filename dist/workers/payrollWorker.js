"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bullmq_1 = require("bullmq");
const redis_js_1 = require("../config/redis.js");
const transferService_js_1 = require("../services/transferService.js");
const decimal_js_1 = require("../utils/decimal.js");
const PAYROLL_QUEUE = "payroll-queue";
const payrollWorker = new bullmq_1.Worker(PAYROLL_QUEUE, async (job) => {
    const { transfers } = job.data;
    for (let i = 0; i < transfers.length; i += 1) {
        const transfer = transfers[i];
        try {
            await (0, transferService_js_1.runTransferLogic)(transfer.fromAccountId, transfer.toAccountId, (0, decimal_js_1.toMoney)(transfer.amount), transfer.idempotencyKey, transfer.quoteId);
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
    connection: redis_js_1.redisConnection,
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
