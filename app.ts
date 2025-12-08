import express, { json, urlencoded } from "express";
import { join } from "path";
import logger from "morgan";
import openapiJSdoc from "swagger-jsdoc";
import openapiUI from "swagger-ui-express";

import indexRouter from "./routes/router.ts";
import usersRouter from "./routes/users.ts";

const options = {
    failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Foodies API specification",
            version: "1.0.0",
        },
    },
    apis: ["./routes/*.ts"],
};

const openapiSpec = openapiJSdoc(options);

var app = express();

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use("/public", express.static(join(import.meta.dirname, "public")));

app.use('/api-docs', openapiUI.serve, openapiUI.setup(openapiSpec));

app.use("/", indexRouter);
app.use("/users", usersRouter);

export default app;
