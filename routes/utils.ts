import type Joi from "joi";
import { type Response } from "express";

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
