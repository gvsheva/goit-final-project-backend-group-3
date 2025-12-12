import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockFindAll = jest.fn();

jest.unstable_mockModule("../../models/index.ts", () => ({
    Category: {
        findAll: mockFindAll,
    },
    Area: {
        findAll: jest.fn(),
    },
    Ingredient: {
        findAll: jest.fn(),
    },
}));

describe("ReferenceDataService.getCategories()", () => {
    beforeEach(() => {
        mockFindAll.mockReset();
    });

    it("should query categories sorted by name ASC", async () => {
        const { default: ReferenceDataService } = await import(
            "../../services/referenceData.ts"
        );
        const service = new ReferenceDataService();

        mockFindAll.mockResolvedValue([
            { get: () => ({ id: "1", name: "Beef" }) },
            { get: () => ({ id: "2", name: "Breakfast" }) },
        ]);

        const result = await service.getCategories();

        expect(mockFindAll).toHaveBeenCalledTimes(1);
        expect(mockFindAll).toHaveBeenCalledWith({
            attributes: ["id", "name"],
            order: [["name", "ASC"]],
        });

        expect(result).toEqual([
            { id: "1", name: "Beef" },
            { id: "2", name: "Breakfast" },
        ]);
    });
});
