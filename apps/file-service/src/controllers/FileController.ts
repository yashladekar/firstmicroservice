import { Request, Response } from "express";
import { parseExcel } from "../services/ExcelParserService";
import { FileUploadModel } from "../database/models/FileUploadModel";
export default {
    async upload(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // ✅ STEP A: Create file metadata entry
        const fileDoc = await FileUploadModel.create({
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            status: "uploaded",
        });

        try {
            // ✅ STEP B: Parse Excel
            const result = await parseExcel(req.file);

            // ✅ STEP C: Update file metadata after parsing
            await FileUploadModel.findByIdAndUpdate(fileDoc._id, {
                status: "parsed",
                parsedRows: result.validCount,
                failedRows: result.errorCount,
            });

            return res.json({
                message: "File parsed successfully",
                fileId: fileDoc._id, // 🔑 IMPORTANT
                parsedRows: result.validCount,
                failedRows: result.errorCount,
            });
        } catch (err) {
            // ❌ Parsing failed
            await FileUploadModel.findByIdAndUpdate(fileDoc._id, {
                status: "failed",
            });

            return res.status(500).json({ message: "Failed to parse file" });
        }
    },

    async listFiles(req: Request, res: Response) {
        const files = await FileUploadModel.find()
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(files);
    },

    async getFile(req: Request, res: Response) {
        const file = await FileUploadModel.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        res.json(file);
    },

};
