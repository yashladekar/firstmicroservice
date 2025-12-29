import { z } from "zod";
import type { NextFunction, Request, Response } from "express";

interface ValidationErrorResponseBody {
    message: string;
    errors: z.ZodError["issues"];
}

export default (schema: z.ZodTypeAny) => (
    req: Request,
    res: Response<ValidationErrorResponseBody>,
    next: NextFunction
): void | Response<ValidationErrorResponseBody> => {
    try {
        schema.parse({ body: req.body });
        next();
    } catch (err: unknown) {
        if (!(err instanceof z.ZodError)) {
            throw err;
        }
        return res.status(400).json({
            message: "Validation error",
            errors: err.issues,
        });
    }
};
