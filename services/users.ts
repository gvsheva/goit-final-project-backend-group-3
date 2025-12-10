import type { InferAttributes } from "sequelize";

import { Session, User } from "../models/index.ts";

export type UserDto = Pick<
    InferAttributes<User>,
    "id" | "name" | "email" | "avatar" | "createdAt" | "updatedAt"
>;

export interface SessionDto {
    id: string;
    data: Record<string, unknown>;
    closed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const publicUserAttributes = [
    "id",
    "name",
    "email",
    "avatar",
    "createdAt",
    "updatedAt",
] as const;

export class UsersService {
    async getUsers(): Promise<UserDto[]> {
        const users = await User.findAll({
            attributes: [...publicUserAttributes],
            order: [["createdAt", "DESC"]],
        });

        return users.map((user) => this.toUserDto(user));
    }

    async getUser(userId: string): Promise<UserDto | null> {
        const user = await User.findByPk(userId, {
            attributes: [...publicUserAttributes],
        });

        if (!user) return null;

        return this.toUserDto(user);
    }

    async getUserSessions(userId: string): Promise<SessionDto[]> {
        const sessions = await Session.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
        });

        return sessions.map((session) => this.toSessionDto(session));
    }

    async getUserSession(
        userId: string,
        sessionId: string,
    ): Promise<SessionDto | null> {
        const session = await Session.findOne({
            where: { id: sessionId, userId },
        });

        if (!session) return null;

        return this.toSessionDto(session);
    }

    async closeUserSession(
        userId: string,
        sessionId: string,
    ): Promise<boolean> {
        const session = await Session.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) return false;

        if (!session.closed) {
            session.closed = true;
            await session.save();
        }

        return true;
    }

    private toUserDto(user: User): UserDto {
        return user.get({ plain: true }) as UserDto;
    }

    private toSessionDto(session: Session): SessionDto {
        return {
            id: session.id,
            data: session.data,
            closed: session.closed,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }
}

export default UsersService;
