import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";

const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

export const noteMatchQueue = new Queue(
    "sap-note-match-queue",
    { connection }
);

export const systemMatchQueue = new Queue(
    "sap-system-match-queue",
    { connection }
);
