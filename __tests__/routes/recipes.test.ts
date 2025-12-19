import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import type { Express } from "express";

const mockUser = {
    id: "user-123456789012345",
    name: "Test User",
    email: "test@example.com",
    avatar: null,
};

const mockSession = {
    id: "session-12345678901234",
    userId: "user-123456789012345",
    data: {},
    closed: false,
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockCategory = {
    id: "cat-1234567890123456",
    name: "Test Category",
};

const mockArea = {
    id: "area-123456789012345",
    name: "Test Area",
};

const mockRecipe = {
    id: "recipe-1234567890123",
    name: "Test Recipe",
    description: "Test description",
    instructions: "Test instructions",
    time: 30,
    img: "/public/recipes/test.jpg",
    categoryId: "cat-1234567890123456",
    areaId: "area-123456789012345",
    ownerId: "user-123456789012345",
    category: mockCategory,
    area: mockArea,
    owner: mockUser,
    ingredients: [],
    dataValues: {
        favoritesCount: "5",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    destroy: jest.fn(),
    get: jest.fn(function (this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            return {
                id: this.id,
                name: this.name,
                description: this.description,
                instructions: this.instructions,
                time: this.time,
                img: this.img,
                categoryId: this.categoryId,
                areaId: this.areaId,
                ownerId: this.ownerId,
                category: this.category,
                area: this.area,
                owner: this.owner,
                ingredients: this.ingredients,
            };
        }
        return this;
    }),
};

const mockRecipeModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    sequelize: {
        literal: jest.fn((sql: string) => sql),
    },
    associations: {
        owner: {},
        category: {},
        area: {},
        ingredients: {},
    },
};

const mockCategoryModel = {
    findByPk: jest.fn(),
};

const mockAreaModel = {
    findByPk: jest.fn(),
};

const mockIngredientModel = {
    findOne: jest.fn(),
    create: jest.fn(),
};

const mockRecipeIngredientModel = {
    create: jest.fn(),
    destroy: jest.fn(),
};

const mockFavoriteRecipeModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    destroy: jest.fn(),
};

const mockSessionModel = {
    findOne: jest.fn(),
    associations: {
        user: {},
    },
};

const mockUserFollowerModel = {
    count: jest.fn(),
};

jest.unstable_mockModule("../../models/index.ts", () => ({
    Recipe: mockRecipeModel,
    Category: mockCategoryModel,
    Area: mockAreaModel,
    Ingredient: mockIngredientModel,
    User: { findOne: jest.fn(), findByPk: jest.fn() },
    Session: mockSessionModel,
    FavoriteRecipe: mockFavoriteRecipeModel,
    UserFollower: mockUserFollowerModel,
    RecipeIngredient: mockRecipeIngredientModel,
    Testimonial: {},
    sequelize: { sync: jest.fn() },
    Sequelize: {},
}));

jest.unstable_mockModule("../../models/userFollower.ts", () => ({
    UserFollower: mockUserFollowerModel,
}));

jest.unstable_mockModule("../../models/recipe.ts", () => ({
    Recipe: mockRecipeModel,
}));

jest.unstable_mockModule("../../models/recipeIngredient.ts", () => ({
    RecipeIngredient: mockRecipeIngredientModel,
}));

jest.unstable_mockModule("../../models/ingredient.ts", () => ({
    Ingredient: mockIngredientModel,
}));

jest.unstable_mockModule("../../models/category.ts", () => ({
    Category: mockCategoryModel,
}));

jest.unstable_mockModule("../../models/area.ts", () => ({
    Area: mockAreaModel,
}));

jest.unstable_mockModule("../../models/favoriteRecipe.ts", () => ({
    FavoriteRecipe: mockFavoriteRecipeModel,
}));

jest.unstable_mockModule("nanoid", () => ({
    nanoid: jest.fn(() => "test-nanoid-12345678"),
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

describe("Recipes Routes", () => {
    let app: Express;

    beforeAll(async () => {
        const appModule = await import("../../app.ts");
        app = appModule.default;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockSessionModel.findOne.mockResolvedValue(mockSession);
    });

    describe("GET /recipes/popular", () => {
        it("should return popular recipes", async () => {
            mockRecipeModel.findAll.mockResolvedValue([mockRecipe]);
            mockFavoriteRecipeModel.findAll.mockResolvedValue([]);

            const response = await request(app).get("/recipes/popular");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("items");
            expect(response.body.items).toBeInstanceOf(Array);
        });

        it("should accept limit parameter", async () => {
            mockRecipeModel.findAll.mockResolvedValue([mockRecipe]);
            mockFavoriteRecipeModel.findAll.mockResolvedValue([]);

            const response = await request(app).get("/recipes/popular?limit=10");

            expect(response.status).toBe(200);
            expect(mockRecipeModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                })
            );
        });

        it("should cap limit at 50", async () => {
            mockRecipeModel.findAll.mockResolvedValue([mockRecipe]);
            mockFavoriteRecipeModel.findAll.mockResolvedValue([]);

            await request(app).get("/recipes/popular?limit=100");

            expect(mockRecipeModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 50,
                })
            );
        });
    });

    describe("GET /recipes/:recipeId", () => {
        it("should return recipe details", async () => {
            mockRecipeModel.findByPk.mockResolvedValue(mockRecipe);
            mockFavoriteRecipeModel.findOne.mockResolvedValue(null);

            const response = await request(app).get("/recipes/recipe-1234567890123");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("id");
            expect(response.body).toHaveProperty("title");
            expect(response.body).toHaveProperty("description");
        });

        it("should return 404 for non-existent recipe", async () => {
            mockRecipeModel.findByPk.mockResolvedValue(null);

            const response = await request(app).get("/recipes/nonexistent");

            expect(response.status).toBe(404);
        });
    });

    describe("POST /recipes", () => {
        it("should create a recipe when authenticated", async () => {
            mockCategoryModel.findByPk.mockResolvedValue(mockCategory);
            mockAreaModel.findByPk.mockResolvedValue(mockArea);
            mockRecipeModel.create.mockResolvedValue(mockRecipe);
            mockRecipeModel.findByPk.mockResolvedValue(mockRecipe);

            const response = await request(app)
                .post("/recipes")
                .set("Authorization", "Bearer test-jwt-token")
                .send({
                    name: "Test Recipe",
                    description: "Test description",
                    instructions: "Test instructions",
                    time: 30,
                    categoryId: "cat-1234567890123456",
                    areaId: "area-123456789012345",
                });

            expect(response.status).toBe(201);
        });

        it("should return 401 without authentication", async () => {
            mockSessionModel.findOne.mockResolvedValue(null);

            const response = await request(app).post("/recipes").send({
                name: "Test Recipe",
                description: "Test description",
                instructions: "Test instructions",
                time: 30,
                categoryId: "cat-1234567890123456",
                areaId: "area-123456789012345",
            });

            expect(response.status).toBe(401);
        });

        it("should return 400 for validation error", async () => {
            const response = await request(app)
                .post("/recipes")
                .set("Authorization", "Bearer test-jwt-token")
                .send({
                    name: "Test Recipe",
                    // missing required fields
                });

            expect(response.status).toBe(400);
        });
    });

    describe("GET /recipes/own", () => {
        it("should return user's own recipes", async () => {
            mockRecipeModel.findAll.mockResolvedValue([mockRecipe]);

            const response = await request(app)
                .get("/recipes/own")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });

        it("should return 401 without authentication", async () => {
            mockSessionModel.findOne.mockResolvedValue(null);

            const response = await request(app).get("/recipes/own");

            expect(response.status).toBe(401);
        });
    });

    describe("POST /recipes/:recipeId/favorite", () => {
        it("should add recipe to favorites", async () => {
            mockRecipeModel.findByPk.mockResolvedValue(mockRecipe);
            mockFavoriteRecipeModel.findOrCreate.mockResolvedValue([{}, true]);

            const response = await request(app)
                .post("/recipes/recipe-1234567890123/favorite")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("isFavorite", true);
        });

        it("should return 404 for non-existent recipe", async () => {
            mockRecipeModel.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .post("/recipes/nonexistent/favorite")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(404);
        });
    });

    describe("DELETE /recipes/:recipeId/favorite", () => {
        it("should remove recipe from favorites", async () => {
            mockRecipeModel.findByPk.mockResolvedValue(mockRecipe);
            mockFavoriteRecipeModel.destroy.mockResolvedValue(1);

            const response = await request(app)
                .delete("/recipes/recipe-1234567890123/favorite")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(204);
        });

        it("should return 404 for non-existent recipe", async () => {
            mockRecipeModel.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .delete("/recipes/nonexistent/favorite")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(404);
        });
    });

    describe("DELETE /recipes/:recipeId", () => {
        it("should delete own recipe", async () => {
            const recipeToDelete = { ...mockRecipe, destroy: jest.fn() };
            mockRecipeModel.findOne.mockResolvedValue(recipeToDelete);
            mockRecipeIngredientModel.destroy.mockResolvedValue(1);

            const response = await request(app)
                .delete("/recipes/recipe-1234567890123")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(204);
        });

        it("should return 404 when recipe not found or not owner", async () => {
            mockRecipeModel.findOne.mockResolvedValue(null);

            const response = await request(app)
                .delete("/recipes/recipe-1234567890123")
                .set("Authorization", "Bearer test-jwt-token");

            expect(response.status).toBe(404);
        });

        it("should return 401 without authentication", async () => {
            mockSessionModel.findOne.mockResolvedValue(null);

            const response = await request(app).delete("/recipes/recipe-1234567890123");

            expect(response.status).toBe(401);
        });
    });
});
