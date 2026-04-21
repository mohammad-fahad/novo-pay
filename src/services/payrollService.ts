import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { AppError } from "../middlewares/errorHandler.js";
import { type PayrollTransfer } from "../types/api.js";

export interface PayrollJobData {
  transfers: PayrollTransfer[];
}

export interface PayrollJobResult {
  success: true;
  processed: number;
}

const PAYROLL_QUEUE = "payroll-queue";

export const payrollQueue = new Queue<PayrollJobData, PayrollJobResult>(PAYROLL_QUEUE, {
  connection: redisConnection,
});

export async function enqueuePayroll(transfers: PayrollTransfer[]): Promise<string> {
  if (!Array.isArray(transfers) || transfers.length === 0) {
    throw new AppError("Invalid transfers payload", 400);
  }

  const job = await payrollQueue.add(
    "bulk-payroll",
    { transfers },
    {
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 1000,
      backoff: {
        type: "fixed",
        delay: 2000,
      },
    },
  );

  return job.id?.toString() ?? "unknown";
}
