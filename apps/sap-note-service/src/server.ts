import dotenv from "dotenv"
dotenv.config()

import app from "./app"
import { logger } from "./utils/logger"
import "./workers/note.worker";


const PORT = process.env.PORT || 8085

const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} as ${process.env.NODE_ENV}`);
});

const gracefulShutdown = () => {
    logger.info('Received kill signal, shutting down gracefully');
    server.close(() => {
        logger.info('Closed out remaining connections');
        process.exit(0);
    });

    // Force close if it takes too long (e.g., 10 seconds)
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);