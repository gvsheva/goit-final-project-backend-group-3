import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.ts";
import authMiddleware from "../middlewares/auth.ts";

import { uploadSingleImage } from "../middlewares/upload.ts";
import RecipeService from "../services/recipeService.ts";
import { handleServiceError, validateBody } from "./utils.ts";

import {
    FavoriteRecipe,
    Recipe,
    Session,
    type Ingredient,
} from "../models/index.ts";

const router = Router();
const recipeService = new RecipeService();

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 50;
const MIN_LIMIT = 1;

type IngredientJoin = { measure: string | null };

type IngredientWithJoin = Ingredient & {
    through?: IngredientJoin;
    RecipeIngredient?: IngredientJoin;
};

interface RecipeWithFavoritesCount extends Recipe {
    dataValues: Recipe["dataValues"] & {
        favoritesCount?: string | number;
    };
}

const createRecipeSchema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    description: Joi.string().required().min(1),
    instructions: Joi.string().required().min(1),
    time: Joi.number().required().positive().integer(),
    categoryId: Joi.string().required(),
    areaId: Joi.string().required(),
    ingredients: Joi.alternatives()
        .try(Joi.array().items(Joi.string()), Joi.string())
        .optional()
        .default([]),
}).options({ allowUnknown: true, abortEarly: false });

async function getOptionalUserId(req: Request): Promise<string | null> {
    const header = req.get("authorization");
    if (!header) return null;

    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) return null;

    try {
        const payload = jwt.verify(token, authConfig.jwtSecret) as {
            sid?: string;
        };
        if (!payload?.sid) return null;

        const session = await Session.findOne({
            where: { id: payload.sid, closed: false },
            include: [Session.associations.user],
        });

        return session?.user?.id ?? null;
    } catch {
        return null;
    }
}

function sendStub(res: Response, endpoint: string): void {
    res.status(501).json({ message: `${endpoint} not implemented yet` });
}

function getMeasure(ing: IngredientWithJoin): string | null {
    return ing.RecipeIngredient?.measure ?? ing.through?.measure ?? null;
}

function getFavoritesCount(recipe: RecipeWithFavoritesCount): number {
    const count = recipe.dataValues.favoritesCount;
    if (count === undefined || count === null) return 0;
    return typeof count === "string" ? parseInt(count, 10) || 0 : Number(count);
}

/**
 * @openapi
 * /recipes/popular:
 *   get:
 *     summary: Get popular recipes
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: List of popular recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       time:
 *                         type: integer
 *                       imageUrl:
 *                         type: string
 *                       favoritesCount:
 *                         type: integer
 *                       isFavorite:
 *                         type: boolean
 */
router.get(
    "/popular",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const limitRaw = Number(req.query.limit ?? DEFAULT_LIMIT);
            const limit = Number.isFinite(limitRaw)
                ? Math.min(Math.max(limitRaw, MIN_LIMIT), MAX_LIMIT)
                : DEFAULT_LIMIT;
            const userId = await getOptionalUserId(req);

            const rows = (await Recipe.findAll({
                attributes: {
                    include: [
                        [
                            Recipe.sequelize!.literal(
                                `(SELECT COUNT(*) FROM "FavoriteRecipes" f WHERE f."recipeId" = "Recipe"."id")`,
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
                order: [
                    [
                        Recipe.sequelize!.literal(
                            `(SELECT COUNT(*) FROM "FavoriteRecipes" f WHERE f."recipeId" = "Recipe"."id")`,
                        ),
                        "DESC",
                    ],
                    ["createdAt", "DESC"],
                ],
                limit,
            })) as RecipeWithFavoritesCount[];

            const recipeIds = rows.map((r) => r.id);

            let favoritesSet = new Set<string>();
            if (userId && recipeIds.length) {
                const favs = await FavoriteRecipe.findAll({
                    where: { userId, recipeId: recipeIds },
                    attributes: ["recipeId"],
                });
                favoritesSet = new Set(favs.map((f) => f.recipeId));
            }

            res.json({
                items: rows.map((r) => ({
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
                    favoritesCount: getFavoritesCount(r),
                    isFavorite: userId ? favoritesSet.has(r.id) : false,
                })),
            });
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /recipes:
 *   post:
 *     tags:
 *       - Recipes
 *     summary: Create a new recipe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - instructions
 *               - time
 *               - categoryId
 *               - areaId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               instructions:
 *                 type: string
 *               time:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *               areaId:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               img:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/",
    authMiddleware,
    uploadSingleImage,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = validateBody(createRecipeSchema, req.body, res);
            if (!validated) return;

            const { name, description, instructions, time, categoryId, areaId, ingredients } =
                validated;

            const img = req.file?.path ?? null;
            const userId = req.session.user.id;

            const recipe = await recipeService.createRecipe({
                ownerId: userId,
                name,
                description,
                instructions,
                time: Number(time),
                categoryId,
                areaId,
                ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
                img,
            });

            res.status(201).json(recipe);
        } catch (err) {
            handleServiceError(err, res, next);
        }
    },
);

/**
 * @openapi
 * /recipes/favorites:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get user's favorite recipes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (1-100)
 *     responses:
 *       200:
 *         description: List of favorite recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/favorites",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.user.id;
            const { page = "1", limit = "10" } = req.query;

            const pageNum = parseInt(page as string, 10);
            const limitNum = parseInt(limit as string, 10);

            if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
                res.status(400).json({
                    message:
                        "Invalid pagination parameters. Page must be >= 1, limit between 1-100",
                });
                return;
            }

            const { count, rows } = await recipeService.getFavoriteRecipes(userId, {
                limit: limitNum,
                offset: (pageNum - 1) * limitNum,
            });

            res.json({
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPages: count > 0 ? Math.ceil(count / limitNum) : 0,
                recipes: rows,
            });
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /recipes/own:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get own recipes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's recipes
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/own",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.user.id;
            const recipes = await recipeService.getOwnRecipes(userId);
            res.json(recipes);
        } catch (e) {
            handleServiceError(e, res, next);
        }
    },
);

/**
 * @openapi
 * /recipes:
 *   get:
 *     summary: Get all recipes with filtering and pagination
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: areaId
 *         schema:
 *           type: string
 *         description: Filter by area ID
 *       - in: query
 *         name: ingredientName
 *         schema:
 *           type: string
 *         description: Filter by ingredient name
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *         description: Filter by owner ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of recipes with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: No recipes found
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            categoryId = null,
            areaId = null,
            ingredientName = null,
            ownerId = null,
            page = "1",
            limit = "10",
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            res.status(400).json({
                message:
                    "Invalid pagination parameters. Page must be >= 1, limit between 1-100",
            });
            return;
        }

        const { count, rows } = await recipeService.getAllRecipes(
            {
                categoryId: categoryId as string | null,
                areaId: areaId as string | null,
                ingredientName: ingredientName as string | null,
                ownerId: ownerId as string | null,
            },
            {
                limit: limitNum,
                offset: (pageNum - 1) * limitNum,
            }
        );

        res.status(200).json({
            total: count,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum),
            recipes: rows,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @openapi
 * /recipes/{recipeId}:
 *   get:
 *     summary: Get recipe details by id
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe details
 *       404:
 *         description: Recipe not found
 */
router.get(
    "/:recipeId",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params;

            const recipe = await Recipe.findByPk(recipeId, {
                include: [
                    {
                        association: Recipe.associations.owner,
                        attributes: ["id", "name", "avatar"],
                    },
                    {
                        association: Recipe.associations.category,
                        attributes: ["id", "name"],
                    },
                    {
                        association: Recipe.associations.area,
                        attributes: ["id", "name"],
                    },
                    {
                        association: Recipe.associations.ingredients,
                        attributes: ["id", "name", "img"],
                        through: { attributes: ["measure"] },
                    },
                ],
            });

            if (!recipe) {
                res.status(404).json({ message: "Recipe not found" });
                return;
            }

            const userId = await getOptionalUserId(req);
            let isFavorite = false;

            if (userId) {
                const fav = await FavoriteRecipe.findOne({
                    where: { userId, recipeId },
                });
                isFavorite = Boolean(fav);
            }

            res.json({
                id: recipe.id,
                title: recipe.name,
                description: recipe.description,
                instructions: recipe.instructions,
                time: recipe.time,
                imageUrl: recipe.img,
                category: recipe.category
                    ? { id: recipe.category.id, name: recipe.category.name }
                    : null,
                area: recipe.area
                    ? { id: recipe.area.id, name: recipe.area.name }
                    : null,
                author: recipe.owner
                    ? {
                          id: recipe.owner.id,
                          name: recipe.owner.name,
                          avatarUrl: recipe.owner.avatar ?? null,
                      }
                    : null,
                ingredients: (recipe.ingredients ?? []).map((ing) => {
                    const i = ing as IngredientWithJoin;

                    return {
                        id: i.id,
                        name: i.name,
                        imageUrl: i.img,
                        measure: getMeasure(i),
                    };
                }),
                isFavorite,
            });
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /recipes/{recipeId}/favorite:
 *   post:
 *     summary: Add recipe to favorites
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Added to favorites
 *       404:
 *         description: Recipe not found
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/:recipeId/favorite",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params;
            const userId = req.session.user.id;

            const recipe = await Recipe.findByPk(recipeId);
            if (!recipe) {
                res.status(404).json({ message: "Recipe not found" });
                return;
            }

            await FavoriteRecipe.findOrCreate({
                where: { userId, recipeId },
                defaults: { userId, recipeId },
            });

            res.status(201).json({ isFavorite: true });
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /recipes/{recipeId}/favorite:
 *   delete:
 *     summary: Remove recipe from favorites
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Removed from favorites
 *       404:
 *         description: Recipe not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
    "/:recipeId/favorite",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params;
            const userId = req.session.user.id;

            const recipe = await Recipe.findByPk(recipeId);
            if (!recipe) {
                res.status(404).json({ message: "Recipe not found" });
                return;
            }

            await FavoriteRecipe.destroy({ where: { userId, recipeId } });

            res.status(204).send();
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /recipes/{recipeId}:
 *   delete:
 *     tags:
 *       - Recipes
 *     summary: Delete own recipe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Recipe deleted
 *       404:
 *         description: Recipe not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.delete(
    "/:recipeId",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.session.user.id;
            await recipeService.deleteOwnRecipe(req.params.recipeId, userId);
            res.status(204).send();
        } catch (e) {
            handleServiceError(e, res, next);
        }
    },
);

export default router;
