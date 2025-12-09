import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import type { InferAttributes } from "sequelize";

import authConfig from "../config/auth.ts";
import { Session, User } from "../models/index.ts";

type PublicUser = Omit<InferAttributes<User>, "password">;

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    avatar?: string;
    sessionData?: Record<string, unknown>;
}

export interface LoginPayload {
    email: string;
    password: string;
    sessionData?: Record<string, unknown>;
}

export interface AuthResult {
    user: PublicUser;
    token: string;
    sessionId: string;
}

export interface AuthServiceOptions {
    jwtSecret?: string;
    jwtExpiresIn?: string;
    bcryptSaltRounds?: number;
}

export class AuthServiceError extends Error {
    status: number;
    code: string;

    constructor(message: string, status = 400, code = "AUTH_ERROR") {
        super(message);
        this.name = "AuthServiceError";
        this.status = status;
        this.code = code;
    }
}

export class AuthService {
    async register(payload: RegisterPayload) {
        const existing = await User.findOne({
            where: { email: payload.email },
        });
        if (existing) {
            throw new AuthServiceError(
                "Email is already registered",
                409,
                "EMAIL_TAKEN",
            );
        }

        const hashedPassword = await bcrypt.hash(
            payload.password,
            authConfig.bcryptSaltRounds,
        );

        const user = await User.create({
            id: nanoid(),
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            avatar: payload.avatar,
        });

        const session = await this.createSession(
            user,
            payload.sessionData ?? {},
        );

        return {
            user: this.toPublicUser(user),
            ...session,
        };
    }

    async login(payload: LoginPayload) {
        const user = await User.findOne({ where: { email: payload.email } });
        if (!user) {
            throw new AuthServiceError(
                "Invalid email or password",
                401,
                "INVALID_CREDENTIALS",
            );
        }

        const passwordMatches = await this.passwordsMatch(
            payload.password,
            user.password,
        );

        if (!passwordMatches) {
            throw new AuthServiceError(
                "Invalid email or password",
                401,
                "INVALID_CREDENTIALS",
            );
        }

        const session = await this.createSession(
            user,
            payload.sessionData ?? {},
        );

        return {
            user: this.toPublicUser(user),
            ...session,
        };
    }

    async logout(sessionId: string) {
        const session = await Session.findByPk(sessionId);

        if (!session || session.closed) {
            return;
        }

        session.closed = true;
        await session.save();
    }

    private toPublicUser(user: User) {
        const { password, ...rest } = user.get({
            plain: true,
        }) as InferAttributes<User>;

        return rest;
    }

    private async createSession(
        user: User,
        sessionData: Record<string, unknown>,
    ) {
        const sessionId = nanoid();
        const token = this.generateToken(user.id, sessionId, user.email);

        await Session.create({
            id: sessionId,
            userId: user.id,
            data: sessionData,
            closed: false,
        });

        return { token, sessionId };
    }

    private generateToken(userId: string, sessionId: string, email: string) {
        return jwt.sign({ sid: sessionId, email }, authConfig.jwtSecret, {
            subject: userId,
            expiresIn: authConfig.jwtExpiresIn,
        });
    }

    private async passwordsMatch(candidate: string, stored: string) {
        return bcrypt.compare(candidate, stored);
    }
}
