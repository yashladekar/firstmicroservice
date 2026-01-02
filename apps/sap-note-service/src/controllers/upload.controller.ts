import { Request, Response } from "express";
import { noteQueue } from "../queues/note.queue";

export async function uploadSapNote(req: Request, res: Response) {
    const file = req.file!;
    await noteQueue.add("parse-note", {
        filePath: file.path,
    });

    res.json({
        message: "SAP Note uploaded and queued",
    });
}
