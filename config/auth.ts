import type { StringValue } from "ms";
import { getenv } from "./utils.ts";

export default {
    jwtSecret: getenv("JWT_SECRET"),
    jwtExpiresIn: getenv("JWT_EXPIRES_IN", "7d") as StringValue,
    bcryptSaltRounds: parseInt(getenv("BCRYPT_SALT_ROUNDS", "10")),
};
