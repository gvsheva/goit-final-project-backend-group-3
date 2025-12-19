import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import type { Express } from "express";

const mockUser = {
    id: "user-123456789012345",
    name: "Test User",
    email: "test@example.com",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    get: jest.fn(function (this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            return {
                id: this.id,
                name: this.name,
                email: this.email,
                avatar: this.avatar,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
            };
        }
        return this;
    }),
};

const mockSession = {
    id: "session-12345678901234",
    userId: "user-123456789012345",
    data: { ip: "127.0.0.1" },
    closed: false,
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
};

const mockUserModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
};

const mockSessionModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    associations: {
        user: {},
    },
};

const mockRecipeModel = {
    count: jest.fn(),
};

const mockUserFollowerModel = {
    count: jest.fn(),
};

const mockFavoriteRecipeModel = {
    count: jest.fn(),
};

jest.unstable_mockModule("../../models/index.ts", () => ({
    User: mockUserModel,
    Session: mockSessionModel,
    Recipe: mockRecipeModel,
    UserFollower: mockUserFollowerModel,
    FavoriteRecipe: mockFavoriteRecipeModel,
    Area: { findAll: jest.fn() },
    Category: { findAll: jest.fn() },
    Ingredient: { findAll: jest.fn() },
    RecipeIngredient: { create: jest.fn(), destroy: jest.fn() },
    Testimonial: {},
    sequelize: { sync: jest.fn() },
    Sequelize: {},
}));

jest.unstable_mockModule("../../models/favoriteRecipe.ts", () => ({
    FavoriteRecipe: mockFavoriteRecipeModel,
}));

jest.unstable_mockModule("../../models/userFollower.ts", () => ({
    UserFollower: mockUserFollowerModel,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
    default: {
        sign: jest.fn(() => "test-jwt-token"),
        verify: jest.fn(() => ({ sub: "user-123456789012345", sid: "session-12345678901234" })),
    },
}));

jest.unstable_mockModule("../../config/auth.ts", () => ({
    default: {
        jwtSecret: "test-secret",
        jwtExpiresIn: "1h",
        bcryptSaltRounds: 10,
    },
}));

jest.unstable_mockModule("../../config/directories.ts", () => ({
    DATA_DIRECTORY: "/tmp/data",
    PUBLIC_DIRECTORY: "/tmp/public",
    TMP_DIRECTORY: "/tmp/tmp",
    AVATAR_DIRECTORY: "/tmp/avatar",
}));

jest.unstable_mockModule("fs", () => ({
    default: {
        mkdirSync: jest.fn(),
        existsSync: jest.fn(() => true),
    },
    mkdirSync: jest.fn(),
    existsSync: jest.fn(() => true),
}));

jest.unstable_mockModule("fs/promises", () => ({
    default: {
        access: jest.fn(),
        mkdir: jest.fn(),
        rename: jest.fn(),
        unlink: jest.fn(),
    },
    access: jest.fn(),
    mkdir: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn(),
}));

describe("Users Routes", () => {
    let app: Express;

    beforeAll(async () => {
        const appModule = await import("../../app.ts");
        app = appModule.default;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup auth middleware to pass
        mockSessionModel.findOne.mockResolvedValue(mockSession);
    });

    describe("GET /users", () => {
        it("should return all users when authenticated", async () => {
            const users = [mockUser, { ...mockUser, id: "user-2", get: mockUser.get }];
            mockUserModel.findAll.mockResolvedValue(users);

            const response = await request(app)
                .get("/users")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });

        it("should return 401 without authentication", async () => {
            mockSessionModel.findOne.mockResolvedValue(null);

            const response = await request(app).get("/users");

            expect(response.status).toBe(401);
        });
    });

    describe("GET /users/me", () => {
        it("should return current user with stats", async () => {
            mockUserModel.findByPk.mockResolvedValue(mockUser);
            mockRecipeModel.count.mockResolvedValue(5);
            mockUserFollowerModel.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);
            mockFavoriteRecipeModel.count.mockResolvedValue(7);

            const response = await request(app)
                .get("/users/me")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("id");
            expect(response.body).toHaveProperty("recipesAmount");
            expect(response.body).toHaveProperty("followersAmount");
            expect(response.body).toHaveProperty("followingsAmount");
            expect(response.body).toHaveProperty("favoriteRecipesAmount");
        });

        it("should return 401 without authentication", async () => {
            mockSessionModel.findOne.mockResolvedValue(null);

            const response = await request(app).get("/users/me");

            expect(response.status).toBe(401);
        });
    });

    describe("GET /users/:userId", () => {
        it("should return user by id", async () => {
            mockUserModel.findByPk.mockResolvedValue(mockUser);

            const response = await request(app)
                .get("/users/user-123456789012345")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("id", "user-123456789012345");
        });

        it("should return 404 for non-existent user", async () => {
            mockUserModel.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get("/users/nonexistent")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(404);
        });
    });

    describe("GET /users/me/sessions", () => {
        it("should return user sessions", async () => {
            mockSessionModel.findAll.mockResolvedValue([mockSession]);

            const response = await request(app)
                .get("/users/me/sessions")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
        });
    });

    describe("DELETE /users/me/sessions/:sessionId", () => {
        it("should close a session", async () => {
            const sessionToClose = { ...mockSession, closed: false, save: jest.fn() };
            mockSessionModel.findOne
                .mockResolvedValueOnce(mockSession) // For auth middleware
                .mockResolvedValueOnce(sessionToClose); // For closeUserSession

            const response = await request(app)
                .delete("/users/me/sessions/session-12345678901234")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(204);
        });

        it("should return 404 for non-existent session", async () => {
            mockSessionModel.findOne
                .mockResolvedValueOnce(mockSession) // For auth middleware
                .mockResolvedValueOnce(null); // For closeUserSession

            const response = await request(app)
                .delete("/users/me/sessions/nonexistent")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(404);
        });
    });
});
