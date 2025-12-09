import ms, { type StringValue } from "ms";
import { getenv } from "./utils.ts";

export default {
    jwtSecret: getenv("JWT_SECRET"),
    jwtExpiresIn: ms(getenv("JWT_EXPIRES_IN", "7D") as StringValue) * 1000,
    bcryptSaltRounds: parseInt(getenv("BCRYPT_SALT_ROUNDS", "10")),
};
