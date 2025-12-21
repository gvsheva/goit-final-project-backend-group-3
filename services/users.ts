import type { InferAttributes } from "sequelize";
import path from "path";
import fs from "fs/promises";

import { Recipe, Session, User, UserFollower } from "../models/index.ts";
import { FavoriteRecipe } from "../models/favoriteRecipe.ts";
import { AVATAR_DIRECTORY } from "../config/directories.ts";
import { ServiceError } from "./errors.ts";

export type UserBasicDto = Pick<
    InferAttributes<User>,
    "id" | "name" | "email" | "avatar" | "createdAt" | "updatedAt"
>;

export type UserDto = UserBasicDto & {
    recipesAmount: number;
    followersAmount: number;
    followingsAmount: number;
};

export type CurrentUserDto = Pick<
    InferAttributes<User>,
    "id" | "name" | "email" | "avatar"
> & {
    recipesAmount: number;
    favoriteRecipesAmount: number;
    followersAmount: number;
    followingsAmount: number;
};

export interface SessionDto {
    id: string;
    data: Record<string, unknown>;
    closed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AvatarUpdateResult {
    avatar: string;
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

        const userDtos = await Promise.all(
            users.map(async (user) => {
                const [recipesCount, followersCount, followingCount] = await Promise.all([
                    Recipe.count({ where: { ownerId: user.id } }),
                    UserFollower.count({ where: { id: user.id } }),
                    UserFollower.count({ where: { followerId: user.id } }),
                ]);

                return {
                    ...this.toUserBasicDto(user),
                    recipesAmount: recipesCount,
                    followersAmount: followersCount,
                    followingsAmount: followingCount,
                };
            })
        );

        return userDtos;
    }

    async getUser(userId: string): Promise<UserDto | null> {
        const user = await User.findByPk(userId, {
            attributes: [...publicUserAttributes],
        });

        if (!user) return null;

        const [recipesCount, followersCount, followingCount] = await Promise.all([
            Recipe.count({ where: { ownerId: userId } }),
            UserFollower.count({ where: { id: userId } }),
            UserFollower.count({ where: { followerId: userId } }),
        ]);

        return {
            ...this.toUserBasicDto(user),
            recipesAmount: recipesCount,
            followersAmount: followersCount,
            followingsAmount: followingCount,
        };
    }

    async getCurrentUser(userId: string): Promise<CurrentUserDto> {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new ServiceError("User not found", 404, "USER_NOT_FOUND");
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

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            recipesAmount: addedRecipesCount,
            favoriteRecipesAmount: favoritesCount,
            followersAmount: followersCount,
            followingsAmount: followingCount,
        };
    }

    async getUserSessions(userId: string): Promise<SessionDto[]> {
        if (!userId) {
            throw new ServiceError("User ID is required", 400, "INVALID_USER_ID");
        }

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

    async updateAvatar(userId: string, tempFilePath: string): Promise<AvatarUpdateResult> {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ServiceError("User not found", 404, "USER_NOT_FOUND");
        }

        try {
            await fs.access(AVATAR_DIRECTORY);
        } catch {
            await fs.mkdir(AVATAR_DIRECTORY, { recursive: true });
        }

        const extension = path.extname(tempFilePath);
        const newFileName = `${userId}-${Date.now()}${extension}`;
        const targetPath = path.join(AVATAR_DIRECTORY, newFileName);

        await fs.rename(tempFilePath, targetPath);

        if (user.avatar) {
            await this.deleteOldAvatar(user.avatar);
        }

        const relativePath = "/" + path.posix.join("public", "avatar", newFileName);
        await user.update({ avatar: relativePath });

        return { avatar: relativePath };
    }

    private async deleteOldAvatar(avatarPath: string): Promise<void> {
        try {
            const oldFileName = path.basename(avatarPath);
            const oldPath = path.join(AVATAR_DIRECTORY, oldFileName);

            try {
                await fs.access(oldPath);
                await fs.unlink(oldPath);
            } catch {
                // File doesn't exist, nothing to delete
            }
        } catch (err) {
            console.error("Failed to delete old avatar:", err);
        }
    }

    async getFollowers(userId: string): Promise<UserBasicDto[]> {
        const user = await User.findByPk(userId, {
            include: [
                {
                    association: User.associations.followers,
                    attributes: [...publicUserAttributes],
                },
            ],
        });

        if (!user) {
            throw new ServiceError("User not found", 404, "USER_NOT_FOUND");
        }

        return (user.followers ?? []).map((follower) => this.toUserBasicDto(follower));
    }

    async getFollowing(userId: string): Promise<UserBasicDto[]> {
        const user = await User.findByPk(userId, {
            include: [
                {
                    association: User.associations.following,
                    attributes: [...publicUserAttributes],
                },
            ],
        });

        if (!user) {
            throw new ServiceError("User not found", 404, "USER_NOT_FOUND");
        }

        return (user.following ?? []).map((followed) => this.toUserBasicDto(followed));
    }

    async followUser(followerId: string, targetUserId: string): Promise<void> {
        if (followerId === targetUserId) {
            throw new ServiceError("Cannot follow yourself", 400, "CANNOT_FOLLOW_SELF");
        }

        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            throw new ServiceError("User not found", 404, "USER_NOT_FOUND");
        }

        await UserFollower.findOrCreate({
            where: { id: targetUserId, followerId },
            defaults: { id: targetUserId, followerId },
        });
    }

    async unfollowUser(followerId: string, targetUserId: string): Promise<void> {
        const deleted = await UserFollower.destroy({
            where: { id: targetUserId, followerId },
        });

        if (deleted === 0) {
            throw new ServiceError("Not following this user", 404, "NOT_FOLLOWING");
        }
    }

    private toUserBasicDto(user: User): UserBasicDto {
        return user.get({ plain: true }) as UserBasicDto;
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
