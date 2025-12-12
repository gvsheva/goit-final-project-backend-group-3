import { Recipe } from "../models/recipe.ts";
import { RecipeIngredient } from "../models/recipeIngredient.ts";
import { Ingredient } from "../models/ingredient.ts";
import { Category } from "../models/category.ts";
import { Area } from "../models/area.ts";
import path from "path";
import fs from "fs";

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
    if (!category) {
        throw new Error("Invalid categoryId");
    }

    const area = await Area.findByPk(areaId);
    if (!area) {
        throw new Error("Invalid areaId");
    }

    let finalImagePath: string | null = null;

    if (img) {
        const uploadDir = path.join("uploads", "recipes");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true});
        }

        const fileName = path.basename(img);
        const targetPath = path.join(uploadDir, fileName);

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
    })

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
