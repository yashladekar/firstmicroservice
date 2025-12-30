import { Request, Response, NextFunction } from "express";

export const internalAuth = (req: Request, res: Response, next: NextFunction) => {
    const internalKey = req.headers["x-internal-key"];
    const expectedKey = process.env.INTERNAL_SECRET;

    // Allow healthcheck endpoints to bypass
    if (req.path.includes("/health")) return next();

    if (!internalKey || internalKey !== expectedKey) {
        return res.status(401).json({ message: "Unauthorized internal request" });
    }

    next();
};
