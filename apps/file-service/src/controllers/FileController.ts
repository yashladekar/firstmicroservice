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
                sheetsProcessed: result.validCount > 0,
                parsedRows: result.validCount,
                failedRows: result.errorCount,
                errors: result.errors.slice(0, 10), // prevent huge payload
            });
        } catch (err) {
            console.error("Parser error:", err);
            return res.status(500).json({ message: "Failed to parse file" });
        }
    }
};
