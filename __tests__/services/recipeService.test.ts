import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockCategory = {
    id: "cat-1234567890123456",
    name: "Test Category",
};

const mockArea = {
    id: "area-123456789012345",
    name: "Test Area",
};

const mockIngredient = {
    id: "ing-1234567890123456",
    name: "Test Ingredient",
    description: "Test description",
    img: "/img/ingredient.jpg",
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
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
    area: mockArea,
    ingredients: [mockIngredient],
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

jest.unstable_mockModule("nanoid", () => ({
    nanoid: jest.fn(() => "test-nanoid-12345678"),
}));

jest.unstable_mockModule("fs/promises", () => ({
    default: {
        access: jest.fn(() => Promise.resolve()),
        mkdir: jest.fn(() => Promise.resolve()),
        rename: jest.fn(() => Promise.resolve()),
        unlink: jest.fn(() => Promise.resolve()),
    },
}));

jest.unstable_mockModule("../../config/directories.ts", () => ({
    PUBLIC_DIRECTORY: "/tmp/public",
}));

describe("RecipeService", () => {
    let RecipeService: any;
    let ServiceError: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const recipeServiceModule = await import("../../services/recipeService.ts");
        RecipeService = recipeServiceModule.RecipeService;

        const errorsModule = await import("../../services/errors.ts");
        ServiceError = errorsModule.ServiceError;
    });

    describe("createRecipe", () => {
        it("should create a recipe successfully", async () => {
            mockCategoryModel.findByPk.mockResolvedValue(mockCategory);
            mockAreaModel.findByPk.mockResolvedValue(mockArea);
            mockRecipeModel.create.mockResolvedValue({ ...mockRecipe, id: "test-nanoid-12345678" });
            mockRecipeModel.findByPk.mockResolvedValue(mockRecipe);

            const service = new RecipeService();
            const result = await service.createRecipe({
                ownerId: "user-123456789012345",
                name: "Test Recipe",
                description: "Test description",
                instructions: "Test instructions",
                time: 30,
                categoryId: "cat-1234567890123456",
                areaId: "area-123456789012345",
                ingredients: [],
                img: null,
            });

            expect(result).toBeDefined();
            expect(result.name).toBe("Test Recipe");
            expect(mockRecipeModel.create).toHaveBeenCalled();
        });

        it("should throw error if name is empty", async () => {
            const service = new RecipeService();

            await expect(
                service.createRecipe({
                    ownerId: "user-123456789012345",
                    name: "",
                    description: "Test description",
                    instructions: "Test instructions",
                    time: 30,
                    categoryId: "cat-1234567890123456",
                    areaId: "area-123456789012345",
                    ingredients: [],
                    img: null,
                })
            ).rejects.toThrow("Recipe name is required");
        });

        it("should throw error if time is not positive", async () => {
            const service = new RecipeService();

            await expect(
                service.createRecipe({
                    ownerId: "user-123456789012345",
                    name: "Test Recipe",
                    description: "Test description",
                    instructions: "Test instructions",
                    time: 0,
                    categoryId: "cat-1234567890123456",
                    areaId: "area-123456789012345",
                    ingredients: [],
                    img: null,
                })
            ).rejects.toThrow("Time must be a positive number");
        });

        it("should throw error if too many ingredients", async () => {
            const service = new RecipeService();
            const ingredients = Array(51).fill("ingredient");

            await expect(
                service.createRecipe({
                    ownerId: "user-123456789012345",
                    name: "Test Recipe",
                    description: "Test description",
                    instructions: "Test instructions",
                    time: 30,
                    categoryId: "cat-1234567890123456",
                    areaId: "area-123456789012345",
                    ingredients,
                    img: null,
                })
            ).rejects.toThrow("Maximum 50 ingredients allowed");
        });

        it("should throw error for invalid categoryId", async () => {
            mockCategoryModel.findByPk.mockResolvedValue(null);

            const service = new RecipeService();

            await expect(
                service.createRecipe({
                    ownerId: "user-123456789012345",
                    name: "Test Recipe",
                    description: "Test description",
                    instructions: "Test instructions",
                    time: 30,
                    categoryId: "invalid-category",
                    areaId: "area-123456789012345",
                    ingredients: [],
                    img: null,
                })
            ).rejects.toThrow("Invalid categoryId");
        });

        it("should throw error for invalid areaId", async () => {
            mockCategoryModel.findByPk.mockResolvedValue(mockCategory);
            mockAreaModel.findByPk.mockResolvedValue(null);

            const service = new RecipeService();

            await expect(
                service.createRecipe({
                    ownerId: "user-123456789012345",
                    name: "Test Recipe",
                    description: "Test description",
                    instructions: "Test instructions",
                    time: 30,
                    categoryId: "cat-1234567890123456",
                    areaId: "invalid-area",
                    ingredients: [],
                    img: null,
                })
            ).rejects.toThrow("Invalid areaId");
        });

        it("should create ingredients if they don't exist", async () => {
            mockCategoryModel.findByPk.mockResolvedValue(mockCategory);
            mockAreaModel.findByPk.mockResolvedValue(mockArea);
            mockRecipeModel.create.mockResolvedValue({ ...mockRecipe, id: "test-nanoid-12345678" });
            mockRecipeModel.findByPk.mockResolvedValue(mockRecipe);
            mockIngredientModel.findOne.mockResolvedValue(null);
            mockIngredientModel.create.mockResolvedValue(mockIngredient);
            mockRecipeIngredientModel.create.mockResolvedValue({});

            const service = new RecipeService();
            await service.createRecipe({
                ownerId: "user-123456789012345",
                name: "Test Recipe",
                description: "Test description",
                instructions: "Test instructions",
                time: 30,
                categoryId: "cat-1234567890123456",
                areaId: "area-123456789012345",
                ingredients: ["New Ingredient"],
                img: null,
            });

            expect(mockIngredientModel.create).toHaveBeenCalled();
            expect(mockRecipeIngredientModel.create).toHaveBeenCalled();
        });
    });

    describe("getOwnRecipes", () => {
        it("should return user's recipes", async () => {
            mockRecipeModel.findAll.mockResolvedValue([mockRecipe]);

            const service = new RecipeService();
            const result = await service.getOwnRecipes("user-123456789012345");

            expect(result).toHaveLength(1);
            expect(mockRecipeModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { ownerId: "user-123456789012345" },
                })
            );
        });
    });

    describe("deleteOwnRecipe", () => {
        it("should delete recipe successfully", async () => {
            const recipeToDelete = {
                ...mockRecipe,
                destroy: jest.fn(),
            };
            mockRecipeModel.findOne.mockResolvedValue(recipeToDelete);
            mockRecipeIngredientModel.destroy.mockResolvedValue(1);

            const service = new RecipeService();
            await service.deleteOwnRecipe("recipe-1234567890123", "user-123456789012345");

            expect(mockRecipeIngredientModel.destroy).toHaveBeenCalled();
            expect(recipeToDelete.destroy).toHaveBeenCalled();
        });

        it("should throw error if recipe not found", async () => {
            mockRecipeModel.findOne.mockResolvedValue(null);

            const service = new RecipeService();

            await expect(
                service.deleteOwnRecipe("nonexistent", "user-123456789012345")
            ).rejects.toThrow("Recipe not found or access denied");
        });

        it("should throw error if user is not the owner", async () => {
            mockRecipeModel.findOne.mockResolvedValue(null);

            const service = new RecipeService();

            await expect(
                service.deleteOwnRecipe("recipe-1234567890123", "other-user")
            ).rejects.toThrow("Recipe not found or access denied");
        });
    });
});
