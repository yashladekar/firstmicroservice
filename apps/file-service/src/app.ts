import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimiter from "./middleware/rateLimit";
import { internalAuth } from "./middleware/internalAuth";
import { errorConverter, errorHandler } from "./middleware/errorHandler";
import { correlationId } from "./middleware/correlationId";

import fileRoutes from "./routes/file.routes";
import healthRoutes from "./routes/health.routes";

const app = express();

// ───── Essential Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging + Correlation ID
app.use(correlationId);
app.use(pinoHttp());

// Rate limiting
app.use(rateLimiter);

// Service-to-service authentication
app.use(internalAuth);

// ───── Routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/files", fileRoutes);
app.use("/health", healthRoutes);

// ───── Error Handling ────────────────────────────────────────────────────────
app.use(errorConverter);
app.use(errorHandler);

export default app;
