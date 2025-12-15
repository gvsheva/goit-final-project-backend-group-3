import type { InferAttributes } from "sequelize";

import {Recipe, Session, User, UserFollower} from "../models/index.ts";
import {CurrentUserDto} from "../dto/currentUserDto.ts";
import {FavoriteRecipe} from "../models/favoriteRecipe.ts";

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
            order: [["createdAt", "DESC"], ["id", "ASC"]],
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

    async getCurrentUser(userId: string): Promise<CurrentUserDto | null> {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('User not found');
        }

        const [
            addedRecipesCount,
            followersCount,
            followingCount,
            favoritesCount
        ] = await Promise.all([
            Recipe.count({
                where: { ownerId: userId }
            }),
            UserFollower.count({
                where: { id: userId }
            }),
            UserFollower.count({
                where: { followerId: userId }
            }),
            FavoriteRecipe.count({
                where: { userId: userId }
            })
        ]);

        return new CurrentUserDto(
            user.id,
            user.name,
            user.email,
            user.avatar,
            addedRecipesCount,
            favoritesCount,
            followersCount,
            followingCount
        );
    }

    async getUserSessions(userId: string): Promise<SessionDto[]> {
        const sessions = await Session.findAll({
            where: { userId },
            order: [["createdAt", "DESC"], ["id", "ASC"]],
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
