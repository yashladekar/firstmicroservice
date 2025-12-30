import { Request, Response } from 'express';
import path from 'node:path';
import { fileQueue } from '../queues/file.queue';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Add job to queue
        const job = await fileQueue.add('parse-excel', {
            filePath: path.resolve(req.file.path), // Use absolute path for worker reliability
            fileName: req.file.originalname,
        }, {
            attempts: 3, // SELF HEALING: Retry 3 times if worker crashes
            backoff: {
                type: 'exponential',
                delay: 5000, // Wait 5s, then 10s, then 20s
            },
            removeOnComplete: true, // Don't clog Redis with success logs
            removeOnFail: false, // Keep failed jobs for inspection
        });

        // Return immediately - don't wait for parsing
        return res.status(202).json({
            message: 'File upload accepted. Processing in background.',
            jobId: job.id,
            fileName: req.file.originalname
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};