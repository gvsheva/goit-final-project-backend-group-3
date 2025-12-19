import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockUser = {
    id: "user-123456789012345",
    name: "Test User",
    email: "test@example.com",
    avatar: "/public/avatar/test.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    update: jest.fn(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
};

const mockUserModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
};

const mockSessionModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
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
}));

jest.unstable_mockModule("../../models/favoriteRecipe.ts", () => ({
    FavoriteRecipe: mockFavoriteRecipeModel,
}));

jest.unstable_mockModule("fs/promises", () => ({
    default: {
        access: jest.fn(),
        mkdir: jest.fn(),
        rename: jest.fn(),
        unlink: jest.fn(),
    },
}));

jest.unstable_mockModule("../../config/directories.ts", () => ({
    AVATAR_DIRECTORY: "/tmp/avatar",
}));

describe("UsersService", () => {
    let UsersService: any;
    let ServiceError: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const usersModule = await import("../../services/users.ts");
        UsersService = usersModule.UsersService;

        const errorsModule = await import("../../services/errors.ts");
        ServiceError = errorsModule.ServiceError;
    });

    describe("getUsers", () => {
        it("should return all users", async () => {
            const users = [mockUser, { ...mockUser, id: "user-2", email: "test2@example.com" }];
            mockUserModel.findAll.mockResolvedValue(
                users.map((u) => ({ ...u, get: mockUser.get }))
            );

            const service = new UsersService();
            const result = await service.getUsers();

            expect(result).toHaveLength(2);
            expect(mockUserModel.findAll).toHaveBeenCalledWith({
                attributes: expect.any(Array),
                order: expect.any(Array),
            });
        });
    });

    describe("getUser", () => {
        it("should return user by id", async () => {
            mockUserModel.findByPk.mockResolvedValue(mockUser);

            const service = new UsersService();
            const result = await service.getUser("user-123456789012345");

            expect(result).toBeDefined();
            expect(result?.id).toBe("user-123456789012345");
        });

        it("should return null for non-existent user", async () => {
            mockUserModel.findByPk.mockResolvedValue(null);

            const service = new UsersService();
            const result = await service.getUser("nonexistent");

            expect(result).toBeNull();
        });
    });

    describe("getCurrentUser", () => {
        it("should return current user with stats", async () => {
            mockUserModel.findByPk.mockResolvedValue(mockUser);
            mockRecipeModel.count.mockResolvedValue(5);
            mockUserFollowerModel.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);
            mockFavoriteRecipeModel.count.mockResolvedValue(7);

            const service = new UsersService();
            const result = await service.getCurrentUser("user-123456789012345");

            expect(result).toHaveProperty("recipesAmount", 5);
            expect(result).toHaveProperty("followersAmount", 10);
            expect(result).toHaveProperty("followingsAmount", 3);
            expect(result).toHaveProperty("favoriteRecipesAmount", 7);
        });

        it("should throw error for non-existent user", async () => {
            mockUserModel.findByPk.mockResolvedValue(null);

            const service = new UsersService();

            await expect(service.getCurrentUser("nonexistent")).rejects.toThrow(
                "User not found"
            );
        });
    });

    describe("getUserSessions", () => {
        it("should return user sessions", async () => {
            mockSessionModel.findAll.mockResolvedValue([mockSession]);

            const service = new UsersService();
            const result = await service.getUserSessions("user-123456789012345");

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("session-12345678901234");
        });

        it("should throw error if userId is not provided", async () => {
            const service = new UsersService();

            await expect(service.getUserSessions("")).rejects.toThrow(
                "User ID is required"
            );
        });
    });

    describe("getUserSession", () => {
        it("should return specific session", async () => {
            mockSessionModel.findOne.mockResolvedValue(mockSession);

            const service = new UsersService();
            const result = await service.getUserSession(
                "user-123456789012345",
                "session-12345678901234"
            );

            expect(result).toBeDefined();
            expect(result?.id).toBe("session-12345678901234");
        });

        it("should return null for non-existent session", async () => {
            mockSessionModel.findOne.mockResolvedValue(null);

            const service = new UsersService();
            const result = await service.getUserSession("user-123456789012345", "nonexistent");

            expect(result).toBeNull();
        });
    });

    describe("closeUserSession", () => {
        it("should close session", async () => {
            const sessionToClose = { ...mockSession, closed: false, save: jest.fn() };
            mockSessionModel.findOne.mockResolvedValue(sessionToClose);

            const service = new UsersService();
            const result = await service.closeUserSession(
                "user-123456789012345",
                "session-12345678901234"
            );

            expect(result).toBe(true);
            expect(sessionToClose.closed).toBe(true);
            expect(sessionToClose.save).toHaveBeenCalled();
        });

        it("should return false for non-existent session", async () => {
            mockSessionModel.findOne.mockResolvedValue(null);

            const service = new UsersService();
            const result = await service.closeUserSession("user-123456789012345", "nonexistent");

            expect(result).toBe(false);
        });
    });
});
