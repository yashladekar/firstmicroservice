import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import * as fs from 'fs';
import clientFileService from '../services/file.service';
import { FileJobPayload } from '../queues/file.queue';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const fileWorker = new Worker<FileJobPayload>(
    'file-import-queue',
    async (job: Job) => {
        console.log(`[Job ${job.id}] Processing file: ${job.data.fileName}`);

        try {
            // Run the parsing logic
            const result = await clientFileService.processExcelFile(job.data.filePath);

            // Log specific errors if any occurred during "self-healing"
            if (result.errors.length > 0) {
                await job.log(`Finished with ${result.errors.length} row-level errors.`);
                // Optionally store these errors in a DB table for the user to see
            }

            return result;

        } catch (error) {
            console.error(`[Job ${job.id}] Failed:`, error);
            throw error; // Triggers BullMQ retry mechanism
        } finally {
            // CLEANUP: Always remove the file from temp storage to save disk space
            if (fs.existsSync(job.data.filePath)) {
                fs.unlinkSync(job.data.filePath);
                console.log(`[Job ${job.id}] Temp file deleted.`);
            }
        }
    },
    {
        connection,
        concurrency: 5, // Process 5 files at once
        limiter: {
            max: 10,
            duration: 1000,
        },
    }
);

// Event Listeners for visibility
fileWorker.on('completed', (job) => {
    console.log(`[Job ${job.id}] Completed successfully.`);
});
fileWorker.on('failed', async (job, err) => {
    console.error(`[Job ${job?.id}] Failed permanently: ${err.message}`);

    // PRODUCTION READY: Alert the team or save to a 'FailedJobs' table
    // await prisma.failedJob.create({ 
    //   data: { jobId: job?.id, reason: err.message, payload: job?.data } 
    // });
});