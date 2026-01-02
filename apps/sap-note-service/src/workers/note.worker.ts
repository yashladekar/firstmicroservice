import { Worker } from "bullmq";
import fs from "fs";
import pdf from "pdf-parse";
import prisma from "../config/db";
import { connection } from "../config/redis";
import { extractSapNoteFields } from "../utils/noteExtractor";

export const noteWorker = new Worker(
    "sap-note-queue",
    async (job) => {
        const { filePath } = job.data;

        const buffer = fs.readFileSync(filePath);
        const parsed = await pdf(buffer);

        const text = parsed.text;

        const data = extractSapNoteFields(text);

        if (!data.noteNumber || !data.component) {
            throw new Error("Invalid SAP Note PDF");
        }

        await prisma.sapNote.upsert({
            where: { noteNumber: data.noteNumber },
            update: {
                ...data,
                rawText: text,
            },
            create: {
                ...data,
                rawText: text,
            },
        });
    },
    { connection }
);
