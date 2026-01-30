import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { matchNoteAgainstSystems } from "../services/incrementalMatcher.service";

const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

new Worker(
    "sap-note-match-queue",
    async (job) => {
        await matchNoteAgainstSystems(job.data.noteId);
    },
    { connection }
);
