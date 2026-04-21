const { Worker, Queue, QueueScheduler, Job } = require("bullmq");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const path = require("path");

// Prisma client instance
const prisma = new PrismaClient();

// Import the core transfer logic from the main server module
// Assumes export in server.js: module.exports = { runTransferLogic }
const { runTransferLogic } = require(path.join(__dirname, "server.js"));

// BullMQ connection config
const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const PAYROLL_QUEUE = "payroll-queue";

// Make sure a QueueScheduler is running for delayed/retried jobs
const scheduler = new QueueScheduler(PAYROLL_QUEUE, { connection });

// Instantiate queue (for enqueueing jobs externally)
const payrollQueue = new Queue(PAYROLL_QUEUE, { connection });

// Worker setup
const payrollWorker = new Worker(
  PAYROLL_QUEUE,
  async job => {
    // Each job contains an array of transfers to process in sequence
    const transfers = job.data.transfers;
    if (!Array.isArray(transfers)) throw new Error("Invalid transfers payload");

    for (let i = 0; i < transfers.length; i++) {
      const t = transfers[i];
      // Each transfer must define these keys:
      // { fromAccountId, toAccountId, amount, idempotencyKey, quoteId (optional) }
      try {
        await runTransferLogic(
          t.fromAccountId,
          t.toAccountId,
          t.amount,
          t.idempotencyKey,
          t.quoteId || null
        );
        // Optionally: could add logging per transfer
      } catch (err) {
        // Let BullMQ retry at the job level, so throw to bubble failure
        // Optionally, annotate error with index of failed transfer
        err.failedTransferIndex = i;
        throw err;
      }
    }

    // All transfers successful
    return { success: true, processed: transfers.length };
  },
  {
    connection,
    concurrency: 1, // strictly serial, so each worker only does one payroll batch at a time
    lockDuration: 5 * 60 * 1000, // 5 minutes lock
    // Retry config can also be set on queue.add jobs
  }
);

payrollWorker.on("completed", (job, result) => {
  console.log(`✅ Payroll batch [job ${job.id}] completed:`, result);
});

payrollWorker.on("failed", (job, err) => {
  console.error(`❌ Payroll batch [job ${job?.id}] failed:`, err);
});

// For graceful exit
process.on("SIGINT", async () => {
  console.log("Shutting down payroll worker...");
  await payrollWorker.close();
  await payrollQueue.close();
  process.exit(0);
});

// Optionally, export queue for enqueueing elsewhere
module.exports = { payrollQueue };