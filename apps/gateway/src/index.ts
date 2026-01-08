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
// Only parse JSON/urlencoded for non-proxy routes (auth routes)
// Skip for /api/* routes to allow file uploads to pass through
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    express.json()(req, res, next);
});
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    express.urlencoded({ extended: true })(req, res, next);
});
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
    // Allow unauthenticated access to auth endpoints
    if (
        req.path === "/auth/login" ||
        req.path === "/auth/register" ||
        req.path.endsWith("/auth/login") ||
        req.path.endsWith("/auth/register") ||
        req.path.startsWith("/api/users/auth/")
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

// Route auth endpoints to user service
const USER_SERVICE_URL = process.env.USER_SERVICE_URL!;
const authProxy = proxy(USER_SERVICE_URL, {
    limit: '50mb',
    timeout: 30000,
    proxyErrorHandler: function (err, res, next) {
        console.error("Proxy Error:", err);
        res.status(500).json({ error: "Service unavailable" });
    }
});

app.post("/auth/register", authProxy);
app.post("/auth/login", authProxy);
app.post("/auth/:path", authProxy);
app.get("/auth/:path", authProxy);

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
        parseReqBody: false, // Don't parse body - important for file uploads
        proxyReqPathResolver: (req) => {
            // Reconstruct path as /:service/* instead of just /*
            const service = req.params.service;
            const pathAfterService = req.url;
            return `/${service}${pathAfterService}`;
        },
        proxyReqOptDecorator: (proxyReqOpts) => {
            // Add internal auth header for service-to-service communication
            proxyReqOpts.headers = proxyReqOpts.headers || {};
            proxyReqOpts.headers['x-internal-key'] = process.env.INTERNAL_SECRET || 'secret';
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
