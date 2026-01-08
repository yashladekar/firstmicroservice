import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const correlationId = (req: Request, res: Response, next: NextFunction) => {
    const id = req.headers["x-correlation-id"] || randomUUID();

    req.headers["x-correlation-id"] = id;
    res.setHeader("x-correlation-id", id);

    next();
};
