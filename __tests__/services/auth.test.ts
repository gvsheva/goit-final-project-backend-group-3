import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock dependencies before importing the service
const mockUser = {
    id: "user-123456789012345",
    name: "Test User",
    email: "test@example.com",
    password: "$2a$10$K8ZpSvCMtN4sZJ9qKZJZYeVbGxZJKZJKZJKZJKZJKZJKZJKZJKZJK",
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
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
};

const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
};

const mockSessionModel = {
    findByPk: jest.fn(),
    create: jest.fn(),
};

jest.unstable_mockModule("../../models/index.ts", () => ({
    User: mockUserModel,
    Session: mockSessionModel,
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
    },
}));

jest.unstable_mockModule("../../config/auth.ts", () => ({
    default: {
        jwtSecret: "test-secret",
        jwtExpiresIn: "1h",
        bcryptSaltRounds: 10,
    },
}));

describe("AuthService", () => {
    let AuthService: any;
    let ServiceError: any;
    let bcrypt: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const authModule = await import("../../services/auth.ts");
        AuthService = authModule.AuthService;

        const errorsModule = await import("../../services/errors.ts");
        ServiceError = errorsModule.ServiceError;

        bcrypt = (await import("bcryptjs")).default;
    });

    describe("register", () => {
        it("should register a new user successfully", async () => {
            mockUserModel.findOne.mockResolvedValue(null);
            mockUserModel.create.mockResolvedValue(mockUser);
            mockSessionModel.create.mockResolvedValue(mockSession);

            const authService = new AuthService();
            const result = await authService.register({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
            });

            expect(result).toHaveProperty("user");
            expect(result).toHaveProperty("token");
            expect(result).toHaveProperty("sessionId");
            expect(result.user.email).toBe("test@example.com");
            expect(result.user).not.toHaveProperty("password");
        });

        it("should throw error if email already registered", async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);

            const authService = new AuthService();

            await expect(
                authService.register({
                    name: "Test User",
                    email: "test@example.com",
                    password: "password123",
                })
            ).rejects.toThrow("Email is already registered");
        });
    });

    describe("login", () => {
        it("should login user successfully with valid credentials", async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSessionModel.create.mockResolvedValue(mockSession);
            bcrypt.compare.mockResolvedValue(true);

            const authService = new AuthService();
            const result = await authService.login({
                email: "test@example.com",
                password: "password123",
            });

            expect(result).toHaveProperty("user");
            expect(result).toHaveProperty("token");
            expect(result).toHaveProperty("sessionId");
        });

        it("should throw error for non-existent user", async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            const authService = new AuthService();

            await expect(
                authService.login({
                    email: "nonexistent@example.com",
                    password: "password123",
                })
            ).rejects.toThrow("Invalid email or password");
        });

        it("should throw error for wrong password", async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            const authService = new AuthService();

            await expect(
                authService.login({
                    email: "test@example.com",
                    password: "wrongpassword",
                })
            ).rejects.toThrow("Invalid email or password");
        });
    });

    describe("logout", () => {
        it("should close session on logout", async () => {
            const sessionToClose = { ...mockSession, save: jest.fn() };
            mockSessionModel.findByPk.mockResolvedValue(sessionToClose);

            const authService = new AuthService();
            await authService.logout("session-12345678901234");

            expect(sessionToClose.closed).toBe(true);
            expect(sessionToClose.save).toHaveBeenCalled();
        });

        it("should handle non-existent session gracefully", async () => {
            mockSessionModel.findByPk.mockResolvedValue(null);

            const authService = new AuthService();
            await expect(
                authService.logout("nonexistent-session")
            ).resolves.toBeUndefined();
        });

        it("should handle already closed session gracefully", async () => {
            const closedSession = { ...mockSession, closed: true };
            mockSessionModel.findByPk.mockResolvedValue(closedSession);

            const authService = new AuthService();
            await expect(
                authService.logout("session-12345678901234")
            ).resolves.toBeUndefined();
        });
    });
});
