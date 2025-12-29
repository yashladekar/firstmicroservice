import mongoose from "mongoose";

const ParsedRecordSchema = new mongoose.Schema(
    {
        fileId: { type: String, index: true },
        sheetName: { type: String, index: true },

        rowIndex: Number,

        rawData: {
            type: mongoose.Schema.Types.Mixed, // original row
            required: true,
        },

        normalizedData: {
            type: mongoose.Schema.Types.Mixed, // cleaned version
            required: true,
        },

        extractionQuality: Number, // 0–100
    },
    { timestamps: true }
);

export const ParsedRecordModel = mongoose.model(
    "ParsedRecord",
    ParsedRecordSchema
);
