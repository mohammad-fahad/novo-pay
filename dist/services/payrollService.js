"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollQueue = void 0;
exports.enqueuePayroll = enqueuePayroll;
const bullmq_1 = require("bullmq");
const redis_js_1 = require("../config/redis.js");
const errorHandler_js_1 = require("../middlewares/errorHandler.js");
const PAYROLL_QUEUE = "payroll-queue";
exports.payrollQueue = new bullmq_1.Queue(PAYROLL_QUEUE, {
    connection: redis_js_1.redisConnection,
});
async function enqueuePayroll(transfers) {
    if (!Array.isArray(transfers) || transfers.length === 0) {
        throw new errorHandler_js_1.AppError("Invalid transfers payload", 400);
    }
    const job = await exports.payrollQueue.add("bulk-payroll", { transfers }, {
        attempts: 3,
        removeOnComplete: 1000,
        removeOnFail: 1000,
        backoff: {
            type: "fixed",
            delay: 2000,
        },
    });
    return job.id?.toString() ?? "unknown";
}
