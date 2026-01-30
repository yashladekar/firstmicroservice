import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { matchSystemAgainstNotes } from "../services/incrementalMatcher.service";

const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

new Worker(
    "sap-system-match-queue",
    async (job) => {
        await matchSystemAgainstNotes(job.data.systemSid);
    },
    { connection }
);
