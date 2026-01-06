import { z } from "zod"
import dotenv from "dotenv"

dotenv.config()

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("8084"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    FILE_STORAGE_PATH: z.string().default("/data/files"),
    JWT_SECRET: z.string(),
})
const _env = envSchema.parse(process.env);

export const env = {
    NODE_ENV: _env.NODE_ENV,
    PORT: parseInt(_env.PORT, 10),
    LOG_LEVEL: _env.LOG_LEVEL,
    DATABASE_URL: _env.DATABASE_URL,
    REDIS_URL: _env.REDIS_URL,
    FILE_STORAGE_PATH: _env.FILE_STORAGE_PATH,
    JWT_SECRET: _env.JWT_SECRET,
}
