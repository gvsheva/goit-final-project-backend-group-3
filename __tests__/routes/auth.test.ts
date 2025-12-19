import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import type { Express } from "express";

const mockUser = {
    id: "user-123456789012345",
    name: "Test User",
    email: "test@example.com",
    password: "$2a$10$hashedpassword123456789012345678901234567890",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    get: jest.fn(function (this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            return {
                id: this.id,
                name: this.name,
                email: this.email,
                password: this.password,
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
    data: {},
    closed: false,
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
};

const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
};

const mockSessionModel = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    associations: {
        user: {},
    },
};

const mockUserFollowerModel = {
    count: jest.fn(),
};

jest.unstable_mockModule("../../models/index.ts", () => ({
    User: mockUserModel,
    Session: mockSessionModel,
    Recipe: { findAll: jest.fn(), count: jest.fn() },
    UserFollower: mockUserFollowerModel,
    FavoriteRecipe: { count: jest.fn() },
    Area: { findAll: jest.fn() },
    Category: { findAll: jest.fn() },
    Ingredient: { findAll: jest.fn() },
    RecipeIngredient: { create: jest.fn(), destroy: jest.fn() },
    Testimonial: {},
    sequelize: { sync: jest.fn() },
    Sequelize: {},
}));

jest.unstable_mockModule("../../models/userFollower.ts", () => ({
    UserFollower: mockUserFollowerModel,
}));

jest.unstable_mockModule("nanoid", () => ({
    nanoid: jest.fn(() => "test-nanoid-12345678"),
}));

jest.unstable_mockModule("bcryptjs", () => ({
    default: {
        hash: jest.fn(() => Promise.resolve("hashed-password")),
        compare: jest.fn(() => Promise.resolve(true)),
    },
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

// Mock directories to avoid file system issues
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
        access: jest.fn(() => Promise.resolve()),
        mkdir: jest.fn(() => Promise.resolve()),
        rename: jest.fn(() => Promise.resolve()),
        unlink: jest.fn(() => Promise.resolve()),
    },
    access: jest.fn(() => Promise.resolve()),
    mkdir: jest.fn(() => Promise.resolve()),
    rename: jest.fn(() => Promise.resolve()),
    unlink: jest.fn(() => Promise.resolve()),
}));

// Mock rate limiter to bypass in tests
jest.unstable_mockModule("express-rate-limit", () => ({
    default: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

describe("Auth Routes", () => {
    let app: Express;

    beforeAll(async () => {
        const appModule = await import("../../app.ts");
        app = appModule.default;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /auth/register", () => {
        it("should register a new user", async () => {
            mockUserModel.findOne.mockResolvedValue(null);
            mockUserModel.create.mockResolvedValue(mockUser);
            mockSessionModel.create.mockResolvedValue(mockSession);

            const response = await request(app)
                .post("/auth/register")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "password123",
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("user");
            expect(response.body).toHaveProperty("token");
            expect(response.body.user).not.toHaveProperty("password");
        });

        it("should return 400 for validation error", async () => {
            const response = await request(app)
                .post("/auth/register")
                .send({
                    name: "Test User",
                    // missing email and password
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "Validation error");
        });

        it("should return 409 if email already registered", async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);

            const response = await request(app)
                .post("/auth/register")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "password123",
                });

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty("code", "EMAIL_TAKEN");
        });
    });

    describe("POST /auth/login", () => {
        it("should login with valid credentials", async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSessionModel.create.mockResolvedValue(mockSession);

            const bcrypt = (await import("bcryptjs")).default;
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: "test@example.com",
                    password: "password123",
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("user");
            expect(response.body).toHaveProperty("token");
        });

        it("should return 401 for invalid credentials", async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: "wrong@example.com",
                    password: "wrongpassword",
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty("code", "INVALID_CREDENTIALS");
        });

        it("should return 400 for validation error", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: "invalid-email",
                    password: "password123",
                });

            expect(response.status).toBe(400);
        });
    });

    describe("POST /auth/logout", () => {
        it("should logout successfully", async () => {
            mockSessionModel.findOne.mockResolvedValue(mockSession);
            mockSessionModel.findByPk.mockResolvedValue({ ...mockSession, save: jest.fn() });

            const response = await request(app)
                .post("/auth/logout")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(204);
        });

        it("should return 401 without token", async () => {
            const response = await request(app).post("/auth/logout");

            expect(response.status).toBe(401);
        });
    });
});
