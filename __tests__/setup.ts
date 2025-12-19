import { jest } from "@jest/globals";

// Mock nanoid to return predictable IDs
jest.unstable_mockModule("nanoid", () => ({
    nanoid: jest.fn(() => "test-id-123456789012"),
}));

// Mock fs/promises for file operations
jest.unstable_mockModule("fs/promises", () => ({
    default: {
        access: jest.fn(),
        mkdir: jest.fn(),
        rename: jest.fn(),
        unlink: jest.fn(),
    },
    access: jest.fn(),
    mkdir: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn(),
}));

export const mockUser = {
    id: "user-123456789012345",
    name: "Test User",
    email: "test@example.com",
    password: "$2a$10$hashedpassword",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    get: jest.fn(function(this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            const { get, ...rest } = this;
            return rest;
        }
        return this;
    }),
};

export const mockSession = {
    id: "session-12345678901234",
    userId: "user-123456789012345",
    data: { ip: "127.0.0.1" },
    closed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    get: jest.fn(function(this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            const { get, save, ...rest } = this;
            return rest;
        }
        return this;
    }),
};

export const mockCategory = {
    id: "cat-1234567890123456",
    name: "Test Category",
    createdAt: new Date(),
    updatedAt: new Date(),
    get: jest.fn(function(this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            const { get, ...rest } = this;
            return rest;
        }
        return this;
    }),
};

export const mockArea = {
    id: "area-123456789012345",
    name: "Test Area",
    createdAt: new Date(),
    updatedAt: new Date(),
    get: jest.fn(function(this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            const { get, ...rest } = this;
            return rest;
        }
        return this;
    }),
};

export const mockIngredient = {
    id: "ing-1234567890123456",
    name: "Test Ingredient",
    description: "Test description",
    img: "/img/ingredient.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    get: jest.fn(function(this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            const { get, ...rest } = this;
            return rest;
        }
        return this;
    }),
};

export const mockRecipe = {
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
    owner: mockUser,
    ingredients: [mockIngredient],
    destroy: jest.fn(),
    get: jest.fn(function(this: any, opts?: { plain?: boolean }) {
        if (opts?.plain) {
            const { get, destroy, ...rest } = this;
            return rest;
        }
        return this;
    }),
};

export function createMockModel() {
    return {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn(),
        findOrCreate: jest.fn(),
        update: jest.fn(),
    };
}
