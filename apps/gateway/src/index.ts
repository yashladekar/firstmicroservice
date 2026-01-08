import express from "express";
import proxy from "express-http-proxy";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp());

// Rate limit (important)
app.use(
    rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 120,
        message: "Too many requests",
    })
);

// === Auth Middleware (Gateway level) ===
interface AuthenticatedRequest extends express.Request {
    user?: string | jwt.JwtPayload;
}

type AuthenticateMiddleware = (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
) => void;

const authenticate: AuthenticateMiddleware = (req, res, next) => {
    if (
        req.path === "/auth/login" ||
        req.path === "/auth/register" ||
        req.path.endsWith("/auth/login") ||
        req.path.endsWith("/auth/register")
    ) {
        return next();
    }

    const token: string | undefined = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded: string | jwt.JwtPayload = jwt.verify(
            token,
            process.env.JWT_SECRET!
        );
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Route auth endpoints to user service (without /api prefix)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL!;
app.use("/auth", proxy(USER_SERVICE_URL, {
    limit: '50mb',
    timeout: 30000,
    parseReqBody: false,
    proxyReqOptDecorator: (proxyReqOpts) => {
        return proxyReqOpts;
    },
    proxyErrorHandler: function (err, res, next) {
        console.error("Proxy Error:", err);
        res.status(500).json({ error: "Service unavailable" });
    }
}));

// Apply auth to all microservice routes
app.use("/api", authenticate);

// Dynamic service registry
const SERVICE_URLS: Record<string, string> = {
    users: process.env.USER_SERVICE_URL!,
    products: process.env.PRODUCT_SERVICE_URL!,
    files: process.env.FILE_SERVICE_URL!,
    notes: process.env.SAP_NOTE_SERVICE_URL!,
    core: process.env.SAP_CORE_SERVICE_URL!,
};

app.use("/api/:service", (req, res, next) => {
    const target = SERVICE_URLS[req.params.service];
    if (!target) return res.status(404).send("Service not found");

    return proxy(target, {
        limit: '50mb', // Allow larger file uploads (Excel/PDF)
        timeout: 30000, // 30s timeout for slow operations
        parseReqBody: false,
        proxyReqOptDecorator: (proxyReqOpts) => {
            // ... your existing auth headers logic
            return proxyReqOpts;
        },
        // improved error handling
        proxyErrorHandler: function (err, res, next) {
            console.error("Proxy Error:", err);
            res.status(500).json({ error: "Service unavailable" });
        }
    })(req, res, next);
});
// Healthcheck
app.get("/health", (req, res) =>
    res.json({ status: "ok", service: "gateway" })
);

app.listen(process.env.PORT, () =>
    console.log(`Gateway running at ${process.env.PORT}`)
);
