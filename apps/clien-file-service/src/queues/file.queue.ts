import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Shared Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const fileQueue = new Queue('file-import-queue', { connection });

// Define the payload structure
export interface FileJobPayload {
    filePath: string;
    fileName: string;
    userId?: string; // If you track who uploaded it
}