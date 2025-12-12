import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockCategoryFindAll = jest.fn<(...args: any[]) => Promise<any[]>>();
const mockAreaFindAll = jest.fn<(...args: any[]) => Promise<any[]>>();
const mockIngredientFindAll = jest.fn<(...args: any[]) => Promise<any[]>>();

jest.unstable_mockModule("../../models/index.ts", () => ({
    Category: {
        findAll: mockCategoryFindAll,
    },
    Area: {
        findAll: mockAreaFindAll,
    },
    Ingredient: {
        findAll: mockIngredientFindAll,
    },
}));

describe("ReferenceDataService (models mocked)", () => {
    beforeEach(() => {
        mockCategoryFindAll.mockReset();
        mockAreaFindAll.mockReset();
        mockIngredientFindAll.mockReset();
    });

    it("should query categories sorted by name ASC", async () => {
        const { default: ReferenceDataService } = await import(
            "../../services/referenceData.ts"
        );
        const service = new ReferenceDataService();

        mockCategoryFindAll.mockResolvedValue([
            { get: () => ({ id: "1", name: "Beef" }) },
            { get: () => ({ id: "2", name: "Breakfast" }) },
        ]);

        const result = await service.getCategories();

        expect(mockCategoryFindAll).toHaveBeenCalledTimes(1);
        expect(mockCategoryFindAll).toHaveBeenCalledWith({
            attributes: ["id", "name"],
            order: [["name", "ASC"]],
        });

        expect(result).toEqual([
            { id: "1", name: "Beef" },
            { id: "2", name: "Breakfast" },
        ]);
    });

    it("should query areas ordered by createdAt DESC then id ASC", async () => {
        const { default: ReferenceDataService } = await import(
            "../../services/referenceData.ts"
        );
        const service = new ReferenceDataService();

        mockAreaFindAll.mockResolvedValue([
            { get: () => ({ id: "ua", name: "Ukrainian" }) },
            { get: () => ({ id: "it", name: "Italian" }) },
        ]);

        const result = await service.getAreas();

        expect(mockAreaFindAll).toHaveBeenCalledTimes(1);
        expect(mockAreaFindAll).toHaveBeenCalledWith({
            attributes: ["id", "name"],
            order: [
                ["createdAt", "DESC"],
                ["id", "ASC"],
            ],
        });

        expect(result).toEqual([
            { id: "ua", name: "Ukrainian" },
            { id: "it", name: "Italian" },
        ]);
    });

    it("should query ingredients ordered by createdAt DESC then id ASC and map fields", async () => {
        const { default: ReferenceDataService } = await import(
            "../../services/referenceData.ts"
        );
        const service = new ReferenceDataService();

        mockIngredientFindAll.mockResolvedValue([
            {
                get: () => ({
                    id: "ing1",
                    name: "Salt",
                    description: "Just salt",
                    img: "salt.png",
                }),
            },
        ]);

        const result = await service.getIngredients();

        expect(mockIngredientFindAll).toHaveBeenCalledTimes(1);
        expect(mockIngredientFindAll).toHaveBeenCalledWith({
            attributes: ["id", "name", "description", "img"],
            order: [
                ["createdAt", "DESC"],
                ["id", "ASC"],
            ],
        });

        expect(result).toEqual([
            {
                id: "ing1",
                name: "Salt",
                description: "Just salt",
                img: "salt.png",
            },
        ]);
    });
});
