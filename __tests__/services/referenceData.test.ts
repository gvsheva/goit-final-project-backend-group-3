import { jest, describe, it, expect, beforeEach } from "@jest/globals";

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

jest.unstable_mockModule("../../models/index.ts", () => ({
    Area: mockAreaModel,
    Category: mockCategoryModel,
    Ingredient: mockIngredientModel,
}));

describe("ReferenceDataService", () => {
    let ReferenceDataService: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module = await import("../../services/referenceData.ts");
        ReferenceDataService = module.ReferenceDataService;
    });

    describe("getAreas", () => {
        it("should return all areas", async () => {
            const areas = [
                mockArea,
                { ...mockArea, id: "area-2", name: "Area 2", get: mockArea.get },
            ];
            mockAreaModel.findAll.mockResolvedValue(areas);

            const service = new ReferenceDataService();
            const result = await service.getAreas();

            expect(result).toHaveLength(2);
            expect(mockAreaModel.findAll).toHaveBeenCalledWith({
                attributes: ["id", "name"],
                order: expect.any(Array),
            });
        });

        it("should return empty array when no areas exist", async () => {
            mockAreaModel.findAll.mockResolvedValue([]);

            const service = new ReferenceDataService();
            const result = await service.getAreas();

            expect(result).toHaveLength(0);
        });
    });

    describe("getCategories", () => {
        it("should return all categories", async () => {
            const categories = [
                mockCategory,
                { ...mockCategory, id: "cat-2", name: "Category 2", get: mockCategory.get },
            ];
            mockCategoryModel.findAll.mockResolvedValue(categories);

            const service = new ReferenceDataService();
            const result = await service.getCategories();

            expect(result).toHaveLength(2);
            expect(mockCategoryModel.findAll).toHaveBeenCalledWith({
                attributes: ["id", "name"],
                order: expect.any(Array),
            });
        });

        it("should return empty array when no categories exist", async () => {
            mockCategoryModel.findAll.mockResolvedValue([]);

            const service = new ReferenceDataService();
            const result = await service.getCategories();

            expect(result).toHaveLength(0);
        });
    });

    describe("getIngredients", () => {
        it("should return all ingredients", async () => {
            const ingredients = [
                mockIngredient,
                { ...mockIngredient, id: "ing-2", name: "Ingredient 2", get: mockIngredient.get },
            ];
            mockIngredientModel.findAll.mockResolvedValue(ingredients);

            const service = new ReferenceDataService();
            const result = await service.getIngredients();

            expect(result).toHaveLength(2);
            expect(mockIngredientModel.findAll).toHaveBeenCalledWith({
                attributes: ["id", "name", "description", "img"],
                order: expect.any(Array),
            });
        });

        it("should return empty array when no ingredients exist", async () => {
            mockIngredientModel.findAll.mockResolvedValue([]);

            const service = new ReferenceDataService();
            const result = await service.getIngredients();

            expect(result).toHaveLength(0);
        });
    });
});
