import type Joi from "joi";
import { type Response, type NextFunction } from "express";
import { ServiceError } from "../services/errors.ts";

export function validateBody<T>(
    schema: Joi.ObjectSchema<T>,
    payload: unknown,
    res: Response,
): T | undefined {
    const { error, value } = schema.validate(payload);

    if (error) {
        res.status(400).json({
            message: "Validation error",
            details: error.details.map((d) => d.message),
        });
        return undefined;
    }

    return value as T;
}

export function handleServiceError(
    error: unknown,
    res: Response,
    next: NextFunction,
): void {
    if (error instanceof ServiceError) {
        res.status(error.status).json({
            message: error.message,
            code: error.code,
        });
        return;
    }

    next(error);
}
