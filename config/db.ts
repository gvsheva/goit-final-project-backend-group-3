import { type Options } from "sequelize";
import { getenv } from "./utils.ts";

const dialect = "postgres";
const host = getenv("DB_HOST");
const port = parseInt(getenv("DB_PORT", "5432"));
const username = getenv("DB_USERNAME");
const password = getenv("DB_PASSWORD");
const database = getenv("DB_DATABASE");
const seederStorage = "sequelize";

const dbOptions: Options = {
    dialect,
    host,
    port,
    username,
    password,
    database,
};

export default {
    test: {
        ...dbOptions,
        seederStorage,
    },
    development: {
        ...dbOptions,
        seederStorage,
    },
    production: {
        ...dbOptions,
        seederStorage,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
};
