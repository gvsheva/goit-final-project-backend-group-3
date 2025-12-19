import type { InferAttributes } from "sequelize";
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";

import { Recipe } from "../models/recipe.ts";
import { RecipeIngredient } from "../models/recipeIngredient.ts";
import { Ingredient } from "../models/ingredient.ts";
import { Category } from "../models/category.ts";
import { Area } from "../models/area.ts";
import { PUBLIC_DIRECTORY } from "../config/directories.ts";
import { ServiceError } from "./errors.ts";

export interface CreateRecipeDTO {
    ownerId: string;
    name: string;
    description: string;
    instructions: string;
    time: number;
    categoryId: string;
    areaId: string;
    ingredients: string[];
    img: string;
}

export type RecipeDto = InferAttributes<Recipe> & {
    ingredients?: InferAttributes<Ingredient>[];
    category?: InferAttributes<Category>;
    area?: InferAttributes<Area>;
};

export interface GetAllRecipesFilters {
    categoryId?: string | null;
    areaId?: string | null;
    ingredientName?: string | null;
    ownerId?: string | null;
}

export interface PaginationOptions {
    limit: number;
    offset: number;
}

const MAX_INGREDIENTS = 50;
const RECIPE_IMAGES_DIR = "recipes";

export class RecipeService {
    async createRecipe(data: CreateRecipeDTO): Promise<RecipeDto> {
        const {
            ownerId,
            name,
            description,
            instructions,
            time,
            categoryId,
            areaId,
            ingredients = [],
            img,
        } = data;

        if (!img) {
            throw new ServiceError("Recipe image is required", 400, "IMAGE_REQUIRED");
        } 
        
        try {
            await fs.access(img);
        } catch {
            throw new ServiceError("Uploaded image not found", 400, "IMAGE_NOT_FOUND");
        }


        if (!name || name.trim().length === 0) {
            throw new ServiceError("Recipe name is required", 400, "INVALID_NAME");
        }

        if (time <= 0) {
            throw new ServiceError("Time must be a positive number", 400, "INVALID_TIME");
        }

        if (ingredients.length > MAX_INGREDIENTS) {
            throw new ServiceError(
                `Maximum ${MAX_INGREDIENTS} ingredients allowed`,
                400,
                "TOO_MANY_INGREDIENTS"
            );
        }

        const category = await Category.findByPk(categoryId);
        if (!category) {
            throw new ServiceError("Invalid categoryId", 400, "INVALID_CATEGORY");
        }

        const area = await Area.findByPk(areaId);
        if (!area) {
            throw new ServiceError("Invalid areaId", 400, "INVALID_AREA");
        }

        const finalImagePath = await this.moveImageToPublic(img);


        const recipe = await Recipe.create({
            id: nanoid(),
            ownerId,
            name,
            description,
            instructions,
            time,
            categoryId,
            areaId,
            img: finalImagePath,
        });


        if (ingredients.length > 0) {
            await this.createRecipeIngredients(recipe.id, ingredients);
        }

        const createdRecipe = await Recipe.findByPk(recipe.id, {
            include: [
                { model: Ingredient, as: "ingredients", through: { attributes: [] } },
                { model: Category, as: "category" },
                { model: Area, as: "area" },
            ],
        });

        return createdRecipe!.get({ plain: true }) as RecipeDto;
    }

    async getOwnRecipes(ownerId: string): Promise<RecipeDto[]> {
        const recipes = await Recipe.findAll({
            where: { ownerId },
            include: [
                { model: Ingredient, as: "ingredients", through: { attributes: [] } },
                { model: Category, as: "category" },
                { model: Area, as: "area" },
            ],
        });

        return recipes.map((recipe) => recipe.get({ plain: true }) as RecipeDto);
    }

    async getAllRecipes(
        filters: GetAllRecipesFilters,
        pagination: PaginationOptions
    ): Promise<{ count: number; rows: RecipeDto[] }> {
        const { categoryId, areaId, ingredientName, ownerId } = filters;
        const { limit, offset } = pagination;

        const whereClause: any = {};
        if (categoryId) whereClause.categoryId = categoryId;
        if (areaId) whereClause.areaId = areaId;
        if (ownerId) whereClause.ownerId = ownerId;

        const includeOptions: any[] = [
            { model: Category, as: "category", attributes: ["id", "name"] },
            { model: Area, as: "area", attributes: ["id", "name"] },
        ];

        if (ingredientName) {
            includeOptions.push({
                model: Ingredient,
                as: "ingredients",
                attributes: ["id", "name", "img"],
                where: { name: ingredientName },
                through: { attributes: ["measure"] },
            });
        } else {
            includeOptions.push({
                model: Ingredient,
                as: "ingredients",
                attributes: ["id", "name", "img"],
                through: { attributes: ["measure"] },
            });
        }

        const { count, rows } = await Recipe.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            distinct: true,
        });

        return {
            count,
            rows: rows.map((recipe) => recipe.get({ plain: true }) as RecipeDto),
        };
    }

    async deleteOwnRecipe(recipeId: string, ownerId: string): Promise<void> {
        const recipe = await Recipe.findOne({
            where: { id: recipeId, ownerId },
        });

        if (!recipe) {
            throw new ServiceError(
                "Recipe not found or access denied",
                404,
                "RECIPE_NOT_FOUND"
            );
        }

        if (recipe.img) {
            await this.deleteImage(recipe.img);
        }

        await RecipeIngredient.destroy({
            where: { recipeId },
        });

        await recipe.destroy();
    }

    private async moveImageToPublic(tempPath: string): Promise<string> {
        const recipeImagesDir = path.join(PUBLIC_DIRECTORY, RECIPE_IMAGES_DIR);

        try {
            await fs.access(recipeImagesDir);
        } catch {
            await fs.mkdir(recipeImagesDir, { recursive: true });
        }

        const fileName = path.basename(tempPath);
        const targetPath = path.join(recipeImagesDir, fileName);

        await fs.rename(tempPath, targetPath);

        return "/" + path.posix.join("public", RECIPE_IMAGES_DIR, fileName);
    }

    private async deleteImage(imagePath: string): Promise<void> {
        try {
            const fileName = path.basename(imagePath);
            const fullPath = path.join(PUBLIC_DIRECTORY, RECIPE_IMAGES_DIR, fileName);
            await fs.unlink(fullPath);
        } catch (err) {
            console.error("Failed to delete recipe image:", err);
        }
    }

    private async createRecipeIngredients(
        recipeId: string,
        ingredientNames: string[]
    ): Promise<void> {
        const ingredientPromises = ingredientNames.map(async (ingName) => {
            let ingredient = await Ingredient.findOne({
                where: { name: ingName },
            });

            if (!ingredient) {
                ingredient = await Ingredient.create({
                    id: nanoid(),
                    name: ingName,
                    description: "",
                    img: "",
                });
            }

            return ingredient;
        });

        const ingredients = await Promise.all(ingredientPromises);

        const recipeIngredientPromises = ingredients.map((ingredient) =>
            RecipeIngredient.create({
                recipeId,
                ingredientId: ingredient.id,
            })
        );

        await Promise.all(recipeIngredientPromises);
    }
}

export default RecipeService;