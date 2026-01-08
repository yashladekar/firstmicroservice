import { Request, Response, NextFunction } from "express";
import { noteQueue } from "../queues/note.queue";

export async function uploadSapNote(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded. Please upload a PDF file with field name 'file'",
            });
        }

        await noteQueue.add("parse-note", {
            filePath: req.file.path,
        });

        res.json({
            message: "SAP Note uploaded and queued",
            filename: req.file.originalname,
        });
    } catch (error) {
        next(error);
    }
}
