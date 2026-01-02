import { Worker } from "bullmq";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import prisma from "../config/db";
import { connection } from "../config/redis";
import { normalizePdfText } from "../utils/textNormalizer";
import { extractSapNoteFields } from "../utils/noteExtractor";
import { logger } from "../utils/logger";

interface NoteJob {
    filePath: string;
}

export const noteWorker = new Worker<NoteJob>(
    "sap-note-queue",
    async (job) => {
        const { filePath } = job.data;

        logger.info(`[SAP-NOTE] Parsing PDF: ${filePath}`);

        try {
            if (!fs.existsSync(filePath)) {
                throw new Error("PDF file not found on disk");
            }

            // 1️⃣ Read PDF
            const buffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: buffer });
            const parsed = await parser.getText();
            await parser.destroy();

            // 2️⃣ Normalize text (CRITICAL)
            const normalizedText = normalizePdfText(parsed.text);

            // 3️⃣ Extract structured fields
            const extracted = extractSapNoteFields(normalizedText);

            // 4️⃣ Confidence gate
            logger.info(
                `[SAP-NOTE] confidence=${extracted.confidence} note=${extracted.noteNumber ?? "unknown"}`
            );

            if (!extracted.noteNumber || extracted.confidence < 40) {
                throw new Error(
                    `Low confidence extraction (${extracted.confidence})`
                );
            }


            // 5️⃣ Store SAP Note (upsert)
            const note = await prisma.sapNote.upsert({
                where: { noteNumber: extracted.noteNumber },
                update: {
                    title: extracted.title,
                    priority: extracted.priority,
                    cvssScore: extracted.cvssScore,
                    cvssVector: extracted.cvssVector,
                    confidence: extracted.confidence,
                    correction: extracted.correction,
                    rawText: normalizedText,
                },
                create: {
                    title: extracted.title,
                    noteNumber: extracted.noteNumber,
                    priority: extracted.priority,
                    cvssScore: extracted.cvssScore,
                    cvssVector: extracted.cvssVector,
                    confidence: extracted.confidence,
                    correction: extracted.correction,
                    rawText: normalizedText,
                },
            });

            // 6️⃣ Store affected components (normalized)
            for (const component of extracted.components) {
                await prisma.sapNoteComponent.upsert({
                    where: {
                        noteId_component: {
                            noteId: note.id,
                            component: component.name,
                        },
                    },
                    update: {
                        fromVersion: component.fromVersion,
                        toVersion: component.toVersion,
                    },
                    create: {
                        noteId: note.id,
                        component: component.name,
                        fromVersion: component.fromVersion,
                        toVersion: component.toVersion,
                    },
                });
            }

            logger.info(
                `[SAP-NOTE] Parsed SAP Note ${extracted.noteNumber} successfully`
            );
        } catch (err: any) {
            logger.error(`[SAP-NOTE] Failed to parse PDF: ${err.message}`);
            throw err;
        } finally {
            // 7️⃣ Cleanup
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    },
    {
        connection,
        concurrency: 1,
    }
);
