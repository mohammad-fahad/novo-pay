import { Redis } from "ioredis";

let redisConnection: Redis | undefined;

export function getRedisConnection(): Redis {
  redisConnection ??= new Redis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: process.env.REDIS_PORT ? Number.parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: {},
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  // Prevent noisy unhandled 'error' events from crashing processes.
  redisConnection.on("error", (err) => {
    console.error("[REDIS] connection error:", err.message);
  });

  return redisConnection;
}
