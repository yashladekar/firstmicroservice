import express from "express";
import cors from "cors";
import helmet from "helmet";
import fileRoutes from "./routes/fileRoutes";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/v1", fileRoutes);

mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log("DB connected"))
    .catch(err => console.error("DB error:", err));

app.listen(process.env.PORT, () =>
    console.log(`File-service running on ${process.env.PORT}`)
);
