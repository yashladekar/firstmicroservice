import pino from "pino"
import { env } from "../config/env"

const logger = env.NODE_ENV === "production"
    ? pino({
        level: env.LOG_LEVEL,
        formatters: {
            level(label) {
                return { level: label };
            },
        },
    })
    : pino({
        level: env.LOG_LEVEL,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        },
    });

export { logger };