import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis";
import { AppError } from "../middlewares/errorHandler";
import { type PayrollTransfer } from "../types/api";

export interface PayrollJobData {
  transfers: PayrollTransfer[];
}

export interface PayrollJobResult {
  success: true;
  processed: number;
}

const PAYROLL_QUEUE = "payroll-queue";

let payrollQueue: Queue<PayrollJobData, PayrollJobResult> | undefined;

function getPayrollQueue(): Queue<PayrollJobData, PayrollJobResult> {
  payrollQueue ??= new Queue<PayrollJobData, PayrollJobResult>(PAYROLL_QUEUE, {
    connection: getRedisConnection(),
  });
  return payrollQueue;
}

export async function enqueuePayroll(transfers: PayrollTransfer[]): Promise<string> {
  if (!Array.isArray(transfers) || transfers.length === 0) {
    throw new AppError("Invalid transfers payload", 400);
  }

  const job = await getPayrollQueue().add(
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
