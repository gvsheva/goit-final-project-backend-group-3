import { Recipe } from "../models/recipe.ts";
import { RecipeIngredient } from "../models/recipeIngredient.ts";
import { Ingredient } from "../models/ingredient.ts";
import { Category } from "../models/category.ts";
import { Area } from "../models/area.ts";

import path from "path";
import fs from "fs";
import { PUBLIC_DIRECTORY } from "../config/directories.ts";

interface CreateRecipeDTO {
    ownerId: string;
    name: string;
    description: string;
    instructions: string;
    time: number;
    categoryId: string;
    areaId: string;
    ingredients: string[];
    img: string | null;
}

export async function createRecipe(data: CreateRecipeDTO) {
    const {
        ownerId,
        name,
        description,
        instructions,
        time,
        categoryId,
        areaId,
        ingredients,
        img,

    } = data;

    const category = await Category.findByPk(categoryId);
    if (!category) throw new Error("Invalid categoryId");

    const area = await Area.findByPk(areaId);
    if (!area) throw new Error("Invalid areaId");

    let finalImagePath: string | null = null;

    if (img) {
        const recipeImagesDir = path.join(PUBLIC_DIRECTORY, "recipes");

        if (!fs.existsSync(recipeImagesDir)) {
            fs.mkdirSync(recipeImagesDir, { recursive: true});
        }

        const fileName = path.basename(img);
        const targetPath = path.join(recipeImagesDir, fileName);

        fs.renameSync(img, targetPath);

        finalImagePath = targetPath;

    }

    const recipe = await Recipe.create({
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

        for (const ingName of ingredients) {
            let ingredient = await Ingredient.findOne({
                where: { name: ingName },
            });

            if (!ingredient) {
                ingredient = await Ingredient.create({ name: ingName});
            }

            await RecipeIngredient.create({
                recipeId: recipe.id,
                ingredientId: ingredient.id,

            });
        }
    }

    const createdRecipe = await Recipe.findByPk(recipe.id, {
        include: [
            { model: Ingredient, through: { attributes: [] } },
            Category,
            Area,
        ],
    })

    return createdRecipe;
    

}

export async function getOwnRecipes(ownerId: string) {
    return Recipe.findAll({
        where: { ownerId },
        include: [
            { model: Ingredient, through: { attributes: [] } },
            Category,
            Area,
        ],
    });
}

export async function deleteOwnRecipe(recipeId: string, ownerId: string) {
    const recipe = await Recipe.findOne({
        where: { id: recipeId, ownerId},
    })

    if (!recipe) {
        throw new Error("Recipe not found or access denied");
    }
    
    if (recipe.img) {
        try {
            fs.unlinkSync(recipe.img);
        } catch (_) {}
    }

    await RecipeIngredient.destroy({
        where: { recipeId },
    })

    await recipe.destroy();
}