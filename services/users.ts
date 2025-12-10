import type { InferAttributes } from "sequelize";

import { Session} from "../models/index.ts";

export interface SessionDto {
    id: string;
    data: Record<string, unknown>;
    closed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class UsersService {
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
