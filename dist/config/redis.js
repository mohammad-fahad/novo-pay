"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
const ioredis_1 = require("ioredis");
exports.redisConnection = new ioredis_1.Redis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: process.env.REDIS_PORT ? Number.parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
});
