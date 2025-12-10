import express, { json, urlencoded } from "express";
import { join } from "path";
import logger from "morgan";
import openapiJSdoc from "swagger-jsdoc";
import openapiUI from "swagger-ui-express";

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

var app = express();

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use("/public", express.static(join(import.meta.dirname, "public")));

app.use("/api-docs", openapiUI.serve, openapiUI.setup(openapiSpec));

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/categories", categoriesRouter);
app.use("/areas", areasRouter);
app.use("/ingredients", ingredientsRouter);
app.use("/testimonials", testimonialsRouter);
app.use("/recipes", recipesRouter);

app.use("/public", express.static(PUBLIC_DIRECTORY));

export default app;
