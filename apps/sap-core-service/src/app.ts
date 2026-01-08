import express from "express"
import cors from 'cors'
import helmet from "helmet"
import PinoHttp from "pino-http"
import rateLimit from "./middleware/rateLimit"
import { correlationId } from "./middleware/correlationId"
import { internalAuth } from "./middleware/internalAuth";
import { errorConverter, errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health.routes"
import routes from "./routes/index"
// import fileRoutes from "./routes/file.routes"
const app = express()

app.use(helmet())
app.use(cors({ origin: "*", credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(correlationId);
app.use(PinoHttp())
app.use(rateLimit)

app.use(internalAuth);

app.use("/health", healthRoutes)
app.use("/core/health", healthRoutes)

// Mount routes at /core for gateway access and /api for direct access
app.use("/core", routes);
app.use("/api", routes);

app.use(errorConverter);
app.use(errorHandler);
export default app
