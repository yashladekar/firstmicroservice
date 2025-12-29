import mongoose from "mongoose";

const ParsedRecordSchema = new mongoose.Schema(
    {
        name: String,
        age: Number,
        email: String
    },
    { timestamps: true }
);

export const ParsedRecordModel = mongoose.model(
    "ParsedRecord",
    ParsedRecordSchema
);
