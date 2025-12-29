import mongoose from "mongoose"
import config from "../config/config"

export const connectDB = async (): Promise<void> => {
    if (!config.MONGO_URI) {
        throw new Error("Missing MONGO_URI. Set it in apps/user-service/.env (or process.env).")
    }

    const maxAttempts = 30;
    const delayMs = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.info(`Connecting to database (${attempt}/${maxAttempts})... ${config.MONGO_URI}`)
            await mongoose.connect(config.MONGO_URI)
            console.info("Database connected successfully")
            return
        } catch (error) {
            const isLastAttempt = attempt === maxAttempts
            console.error(
                isLastAttempt
                    ? "Database connection failed (giving up)"
                    : "Database connection failed (will retry)",
                error
            )
            if (isLastAttempt) throw error
            await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
    }
}