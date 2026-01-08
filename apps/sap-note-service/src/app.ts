import express from "express"
import cors from 'cors'
import helmet from "helmet"
import PinoHttp from "pino-http"
import rateLimit from "./middleware/rateLimit"
import { correlationId } from "./middleware/correlationId"
import { internalAuth } from "./middleware/internalAuth";
import { errorConverter, errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health.routes"
import fileRoutes from "./routes/file.routes";

const app = express()

app.use(helmet())
app.use(cors({ origin: "*", credentials: true }))
// Skip body parsing for file upload routes (multipart/form-data)
app.use((req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        return next();
    }
    express.json({ limit: '10mb' })(req, res, next);
});
app.use((req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        return next();
    }
    express.urlencoded({ extended: true })(req, res, next);
});
app.use(correlationId);
app.use(PinoHttp())
app.use(rateLimit)

app.use(internalAuth);

app.use("/health", healthRoutes)
app.use("/notes", fileRoutes);


app.use(errorConverter);
app.use(errorHandler);
export default app
