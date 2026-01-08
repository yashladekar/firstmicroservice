import { Request, Response, NextFunction } from "express";
import APIError from "../utils/APIError";

export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = err;

    // Log the original error for debugging
    console.error("[ERROR]", err.message, err.stack);

    if (!(error instanceof APIError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal server error";
        error = new APIError(statusCode, message, false);
        error.stack = err.stack;
    }

    next(error);
};

export const errorHandler = (err: APIError, req: Request, res: Response, next: NextFunction) => {
    const response: any = {
        code: err.statusCode,
        message: err.message,
    };

    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
};
