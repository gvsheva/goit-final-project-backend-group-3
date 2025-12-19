import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import type { Express } from "express";

const mockArea = {
    id: "area-123456789012345",
    name: "Test Area",
    get: jest.fn(function (this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            return { id: this.id, name: this.name };
        }
        return this;
    }),
};

const mockCategory = {
    id: "cat-1234567890123456",
    name: "Test Category",
    get: jest.fn(function (this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            return { id: this.id, name: this.name };
        }
        return this;
    }),
};

const mockIngredient = {
    id: "ing-1234567890123456",
    name: "Test Ingredient",
    description: "Test description",
    img: "/img/ingredient.jpg",
    get: jest.fn(function (this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            return {
                id: this.id,
                name: this.name,
                description: this.description,
                img: this.img,
            };
        }
        return this;
    }),
};

const mockAreaModel = {
    findAll: jest.fn(),
};

const mockCategoryModel = {
    findAll: jest.fn(),
};

const mockIngredientModel = {
    findAll: jest.fn(),
};

const mockUserFollowerModel = {
    count: jest.fn(),
};

jest.unstable_mockModule("../../models/index.ts", () => ({
    Area: mockAreaModel,
    Category: mockCategoryModel,
    Ingredient: mockIngredientModel,
    User: { findOne: jest.fn(), findByPk: jest.fn() },
    Session: { findOne: jest.fn(), associations: { user: {} } },
    Recipe: { findAll: jest.fn(), count: jest.fn(), associations: {} },
    UserFollower: mockUserFollowerModel,
    FavoriteRecipe: { count: jest.fn(), findAll: jest.fn() },
    RecipeIngredient: { create: jest.fn(), destroy: jest.fn() },
    Testimonial: {},
    sequelize: { sync: jest.fn() },
    Sequelize: {},
}));

jest.unstable_mockModule("../../models/userFollower.ts", () => ({
    UserFollower: mockUserFollowerModel,
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

describe("Reference Data Routes", () => {
    let app: Express;

    beforeAll(async () => {
        const appModule = await import("../../app.ts");
        app = appModule.default;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /categories", () => {
        it("should return all categories", async () => {
            const categories = [
                mockCategory,
                { ...mockCategory, id: "cat-2", name: "Category 2", get: mockCategory.get },
            ];
            mockCategoryModel.findAll.mockResolvedValue(categories);

            const response = await request(app).get("/categories");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty("id");
            expect(response.body[0]).toHaveProperty("name");
        });

        it("should return empty array when no categories exist", async () => {
            mockCategoryModel.findAll.mockResolvedValue([]);

            const response = await request(app).get("/categories");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });

        it("should handle errors gracefully", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            mockCategoryModel.findAll.mockRejectedValue(new Error("Database error"));

            const response = await request(app).get("/categories");

            expect(response.status).toBe(500);
            consoleSpy.mockRestore();
        });
    });

    describe("GET /areas", () => {
        it("should return all areas", async () => {
            const areas = [
                mockArea,
                { ...mockArea, id: "area-2", name: "Area 2", get: mockArea.get },
            ];
            mockAreaModel.findAll.mockResolvedValue(areas);

            const response = await request(app).get("/areas");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty("id");
            expect(response.body[0]).toHaveProperty("name");
        });

        it("should return empty array when no areas exist", async () => {
            mockAreaModel.findAll.mockResolvedValue([]);

            const response = await request(app).get("/areas");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });
    });

    describe("GET /ingredients", () => {
        it("should return all ingredients", async () => {
            const ingredients = [
                mockIngredient,
                { ...mockIngredient, id: "ing-2", name: "Ingredient 2", get: mockIngredient.get },
            ];
            mockIngredientModel.findAll.mockResolvedValue(ingredients);

            const response = await request(app).get("/ingredients");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty("id");
            expect(response.body[0]).toHaveProperty("name");
            expect(response.body[0]).toHaveProperty("description");
            expect(response.body[0]).toHaveProperty("img");
        });

        it("should return empty array when no ingredients exist", async () => {
            mockIngredientModel.findAll.mockResolvedValue([]);

            const response = await request(app).get("/ingredients");

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });
    });
});
