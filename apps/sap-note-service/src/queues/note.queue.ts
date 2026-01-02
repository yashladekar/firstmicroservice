import { Queue } from "bullmq";
import { connection } from "../config/redis";

export interface NoteJobPayload {
    filePath: string;
}

export const noteQueue = new Queue<NoteJobPayload>(
    "sap-note-queue",
    { connection }
);
