import mongoose from "mongoose";

const FileUploadSchema = new mongoose.Schema(
    {
        originalName: String,
        mimeType: String,
        size: Number,

        status: {
            type: String,
            enum: ["uploaded", "parsing", "parsed", "failed"],
            default: "uploaded",
        },

        totalSheets: Number,
        totalRows: Number,
        parsedRows: Number,
        failedRows: Number,
    },
    { timestamps: true }
);

export const FileUploadModel = mongoose.model(
    "FileUpload",
    FileUploadSchema
);
