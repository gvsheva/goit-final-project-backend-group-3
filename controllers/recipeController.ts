import type { Request, Response, NextFunction } from "express";
import * as recipeService from "../services/recipeService.ts";

export async function createRecipe(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const ownerId = req.session.user?.id;

        if (!ownerId) {
            res.status(401).json({ message: "Unauthorized"});
            return;
        }

        const {
            name,
            description,
            instructions,
            time,
            categoryId,
            areaId,
            ingredients,
        } = req.body;

        const imagePath = req.file ? req.file.path : null;


        const recipe = await recipeService.createRecipe({
            ownerId,
            name,
            description,
            instructions,
            time: Number(time),
            categoryId,
            areaId,
            ingredients: Array.isArray(ingredients)
                ? ingredients
                : ingredients
                ? [ingredients]
                : [],
            img: imagePath,
        });

        res.status(201).json(recipe);
    } catch (error) {
        next(error);
    }
}