import type { InferAttributes } from "sequelize";
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";

import { Recipe } from "../models/recipe.ts";
import { RecipeIngredient } from "../models/recipeIngredient.ts";
import { Ingredient } from "../models/ingredient.ts";
import { Category } from "../models/category.ts";
import { Area } from "../models/area.ts";
import { FavoriteRecipe } from "../models/favoriteRecipe.ts";
import { User } from "../models/user.ts";
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
    ingredientIds: string[];
    img: string | null;
}

export type RecipeDto = InferAttributes<Recipe> & {
    ingredients?: InferAttributes<Ingredient>[];
    category?: InferAttributes<Category>;
    area?: InferAttributes<Area>;
    owner?: Pick<InferAttributes<User>, "id" | "name" | "avatar">;
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

export interface FavoriteRecipeDto {
    id: string;
    title: string;
    description: string;
    time: number;
    imageUrl: string | null;
    author: {
        id: string;
        name: string;
        avatarUrl: string | null;
    } | null;
    favoritesCount: number;
    isFavorite: true;
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
            ingredientIds = [],
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

        if (ingredientIds.length > MAX_INGREDIENTS) {
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

        if (ingredientIds.length > 0) {
            await this.createRecipeIngredients(recipe.id, ingredientIds);
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
            { model: User, as: "owner", attributes: ["id", "name", "avatar"] },
        ];

        // ingredient filter (ingredientName param actually contains ingredient ID for backward compatibility)
        if (ingredientName) {
            includeOptions.push({
                model: Ingredient,
                as: "ingredients",
                attributes: ["id", "name", "img"],
                where: { id: ingredientName },
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

    async getFavoriteRecipes(
        userId: string,
        pagination: PaginationOptions
    ): Promise<{ count: number; rows: FavoriteRecipeDto[] }> {
        const { limit, offset } = pagination;

        const { count, rows: favorites } = await FavoriteRecipe.findAndCountAll({
            where: { userId },
            offset,
            limit,
            order: [["createdAt", "DESC"]],
        });

        if (favorites.length === 0) {
            return { count: 0, rows: [] };
        }

        const recipeIds = favorites.map((f) => f.recipeId);

        const recipes = await Recipe.findAll({
            where: { id: recipeIds },
            attributes: {
                include: [
                    [
                        Recipe.sequelize!.literal(
                            `(SELECT COUNT(*) FROM "FavoriteRecipes" f WHERE f."recipeId" = "Recipe"."id")`
                        ),
                        "favoritesCount",
                    ],
                ],
            },
            include: [
                {
                    association: Recipe.associations.owner,
                    attributes: ["id", "name", "avatar"],
                },
            ],
        });

        const recipeMap = new Map(recipes.map((r) => [r.id, r]));
        const orderedRecipes = recipeIds
            .map((id) => recipeMap.get(id))
            .filter((r): r is Recipe => r !== undefined);

        return {
            count,
            rows: orderedRecipes.map((r) => {
                const dataValues = r.dataValues as Recipe["dataValues"] & {
                    favoritesCount?: string | number;
                };
                const rawCount = dataValues.favoritesCount;
                const favoritesCount =
                    rawCount === undefined || rawCount === null
                        ? 0
                        : typeof rawCount === "string"
                          ? parseInt(rawCount, 10) || 0
                          : Number(rawCount);

                return {
                    id: r.id,
                    title: r.name,
                    description: r.description,
                    time: r.time,
                    imageUrl: r.img,
                    author: r.owner
                        ? {
                              id: r.owner.id,
                              name: r.owner.name,
                              avatarUrl: r.owner.avatar ?? null,
                          }
                        : null,
                    favoritesCount,
                    isFavorite: true as const,
                };
            }),
        };
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
        ingredientIds: string[]
    ): Promise<void> {
        const ingredientPromises = ingredientIds.map(async (ingredientId) => {
            const ingredient = await Ingredient.findByPk(ingredientId);

            if (!ingredient) {
                throw new ServiceError(
                    `Ingredient with id "${ingredientId}" not found`,
                    400,
                    "INVALID_INGREDIENT"
                );
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
