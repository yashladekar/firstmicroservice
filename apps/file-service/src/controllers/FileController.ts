import { Request, Response } from "express";
import { parseExcel } from "../services/ExcelParserService";

export default {
    async upload(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        try {
            const result = await parseExcel(req.file);

            return res.json({
                message: "File parsed successfully",
                parsedRows: result.validCount,
                failedRows: result.errorCount,
                errors: result.errors
            });
        } catch (err) {
            console.error("Parser error:", err);
            return res.status(500).json({ message: "Failed to parse file" });
        }
    }
};
