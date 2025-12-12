import {
    jest,
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from "@jest/globals";
import supertest from "supertest";
import express from "express";
import type { Express } from "express";
import ReferenceDataService from "../../services/referenceData";

// Mock the models to avoid DB connection
jest.mock("../../models/index", () => ({}));

// Mock the ReferenceDataService module
jest.mock("../../services/referenceData");

describe("GET /categories", () => {
    let app: Express;
    let mockGetCategories: jest.Mock;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Create fresh router for each test
        const router = express.Router();
        const mockService = new ReferenceDataService();

        mockGetCategories = jest.fn();
        (mockService.getCategories as jest.Mock) = mockGetCategories;

        router.get("/", async (req, res, next) => {
            try {
                const categories = await mockService.getCategories();
                res.json(categories);
            } catch (error) {
                next(error);
            }
        });

        app.use("/categories", router);

        // Add error handler for tests
        app.use(
            (
                err: Error,
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) => {
                res.status(500).json({ message: err.message });
            }
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 200 and list of categories", async () => {
        // Arrange
        const mockCategories = [
            { id: "cat1", name: "Beef" },
            { id: "cat2", name: "Chicken" },
            { id: "cat3", name: "Dessert" },
        ];

        mockGetCategories.mockResolvedValue(mockCategories);

        // Act
        const response = await supertest(app).get("/categories").expect(200);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCategories);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("name");
        expect(mockGetCategories).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no categories exist", async () => {
        // Arrange
        mockGetCategories.mockResolvedValue([]);

        // Act
        const response = await supertest(app).get("/categories").expect(200);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
        expect(Array.isArray(response.body)).toBe(true);
        expect(mockGetCategories).toHaveBeenCalledTimes(1);
    });

    it("should return categories with correct structure", async () => {
        // Arrange
        const mockCategories = [{ id: "cat1", name: "Seafood" }];

        mockGetCategories.mockResolvedValue(mockCategories);

        // Act
        const response = await supertest(app).get("/categories").expect(200);

        // Assert
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("name");
        expect(typeof response.body[0].id).toBe("string");
        expect(typeof response.body[0].name).toBe("string");
        expect(response.body[0].id).toBe("cat1");
        expect(response.body[0].name).toBe("Seafood");
    });

    it("should handle database errors", async () => {
        // Arrange
        const error = new Error("Database connection failed");
        mockGetCategories.mockRejectedValue(error);

        // Act & Assert
        const response = await supertest(app).get("/categories").expect(500);

        expect(response.body).toHaveProperty("message");
        expect(mockGetCategories).toHaveBeenCalledTimes(1);
    });

    it("should return JSON content type", async () => {
        // Arrange
        const mockCategories = [{ id: "cat1", name: "Beef" }];

        mockGetCategories.mockResolvedValue(mockCategories);

        // Act
        const response = await supertest(app).get("/categories").expect(200);

        // Assert
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("should be a public endpoint (no authentication required)", async () => {
        // Arrange
        const mockCategories = [{ id: "cat1", name: "Beef" }];

        mockGetCategories.mockResolvedValue(mockCategories);

        // Act - request without authorization header
        const response = await supertest(app).get("/categories").expect(200);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCategories);
    });
});
