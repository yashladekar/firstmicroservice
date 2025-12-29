import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 8084;
const MONGO_URI = process.env.MONGO_URI!;

let server: any;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        server = app.listen(PORT, () =>
            console.log(`File-service running on port ${PORT}`)
        );
    })
    .catch((err) => console.error("MongoDB error:", err));

// Graceful shutdown
const exitHandler = () => {
    if (server) {
        server.close(() => {
            console.log("Server closed");
            process.exit(0);
        });
    } else {
        process.exit(1);
    }
};

process.on("SIGTERM", exitHandler);
process.on("SIGINT", exitHandler);
