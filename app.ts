import express, { json, urlencoded } from "express";
import type { Request, Response, NextFunction } from "express";
import logger from "morgan";
import openapiJSdoc from "swagger-jsdoc";
import openapiUI from "swagger-ui-express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import indexRouter from "./routes/router.ts";
import authRouter from "./routes/auth.ts";
import usersRouter from "./routes/users.ts";
import categoriesRouter from "./routes/categories.ts";
import areasRouter from "./routes/areas.ts";
import ingredientsRouter from "./routes/ingredients.ts";
import testimonialsRouter from "./routes/testimonials.ts";
import recipesRouter from "./routes/recipes.ts";
import { mkdirSync } from "fs";
import {
    DATA_DIRECTORY,
    PUBLIC_DIRECTORY,
    TMP_DIRECTORY,
} from "./config/directories.ts";

const options = {
    failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Foodies API specification",
            version: "1.0.0",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./routes/*.ts"],
};

const openapiSpec = openapiJSdoc(options);

mkdirSync(DATA_DIRECTORY, { recursive: true });
mkdirSync(TMP_DIRECTORY, { recursive: true });
mkdirSync(PUBLIC_DIRECTORY, { recursive: true });

const app = express();

// Strict rate limiter for auth endpoints (prevent brute force attacks)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // 5 attempts per window
    message: { message: "Too many authentication attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

// General rate limiter for all API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // 100 requests per window
    message: { message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

const allowedOrigins = [
    "http://localhost:3001",
    "https://webclient-foodies.vercel.app"
];

app.use(
    cors({
        origin: allowedOrigins,
    }),
);

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));

app.use("/api-docs", openapiUI.serve, openapiUI.setup(openapiSpec));

app.use("/", indexRouter);
app.use("/auth", authLimiter, authRouter);
app.use("/users", apiLimiter, usersRouter);
app.use("/categories", apiLimiter, categoriesRouter);
app.use("/areas", apiLimiter, areasRouter);
app.use("/ingredients", apiLimiter, ingredientsRouter);
app.use("/testimonials", apiLimiter, testimonialsRouter);
app.use("/recipes", apiLimiter, recipesRouter);

app.use("/public", express.static(PUBLIC_DIRECTORY));

// 404 handler for unmatched routes
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).json({
        message: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
    });
});

export default app;