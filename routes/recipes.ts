import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.ts";
import authMiddleware from "../middlewares/auth.ts";

import { uploadSingleImage } from "../middlewares/upload.ts";
import * as recipeService from "../services/recipeService.ts";

import {
    FavoriteRecipe,
    Recipe,
    Session,
    type Ingredient,
} from "../models/index.ts";

const router = Router();

type IngredientJoin = { measure: string | null };

type IngredientWithJoin = Ingredient & {
    through?: IngredientJoin;
    RecipeIngredient?: IngredientJoin;
};

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

/**
 * @openapi
 * /recipes/popular:
 *   get:
 *     summary: Get popular recipes
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
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
            const limitRaw = Number(req.query.limit ?? 4);
            const limit = Number.isFinite(limitRaw)
                ? Math.min(Math.max(limitRaw, 1), 50)
                : 4;
            const userId = await getOptionalUserId(req);

            const rows = await Recipe.findAll({
                attributes: {
                    include: [
                        [
                            Recipe.sequelize!.literal(
                                `(SELECT COUNT(*) FROM "Favorites" f WHERE f."recipeId" = "Recipe"."id")`
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
                            `(SELECT COUNT(*) FROM "Favorites" f WHERE f."recipeId" = "Recipe"."id")`
                        ),
                        "DESC",
                    ],
                    ["createdAt", "DESC"],
                ],
                limit,
            });

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
                    favoritesCount: Number(
                        (r as any).get?.("favoritesCount") ?? 0
                    ),
                    isFavorite: userId ? favoritesSet.has(r.id) : false,
                })),
            });
        } catch (error) {
            next(error);
        }
    }
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
 *         description: Recipe created
 */

router.post(
    "/",
    authMiddleware,
    uploadSingleImage,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                name,
                description,
                instructions,
                time,
                categoryId,
                areaId,
                ingredients = [],
            } = req.body;

            const img = req.file?.path ?? null;

            const recipe = await recipeService.createRecipe({
                ownerId: req.session!.user!.id,
                name,
                description,
                instructions,
                time: Number(time),
                categoryId,
                areaId,
                ingredients: Array.isArray(ingredients)
                    ? ingredients
                    : [ingredients],
                img,
            });

            res.status(201).json(recipe);
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    "/favorites",
    authMiddleware,
    function (_req: Request, res: Response) {
        sendStub(res, "GET /recipes/favorites");
    }
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
 */

router.get("/own", authMiddleware, async (req, res, next) => {
    try {
        const recipes = await recipeService.getOwnRecipes(
            req.session!.user!.id
        );
        res.json(recipes);
    } catch (e) {
        next(e);
    }
});

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
            next(error);
        }
    }
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
 *       200:
 *         description: Added to favorites
 */
router.post(
    "/:recipeId/favorite",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params;
            const userId = req.session!.user.id;

            const recipe = await Recipe.findByPk(recipeId);
            if (!recipe) {
                res.status(404).json({ message: "Recipe not found" });
                return;
            }

            await FavoriteRecipe.findOrCreate({
                where: { userId, recipeId },
                defaults: { userId, recipeId },
            });

            res.status(200).json({ isFavorite: true });
        } catch (error) {
            next(error);
        }
    }
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
 *       200:
 *         description: Removed from favorites
 */
router.delete(
    "/:recipeId/favorite",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params;
            const userId = req.session!.user.id;

            const recipe = await Recipe.findByPk(recipeId);
            if (!recipe) {
                res.status(404).json({ message: "Recipe not found" });
                return;
            }

            await FavoriteRecipe.destroy({ where: { userId, recipeId } });

            res.status(200).json({ isFavorite: false });
        } catch (error) {
            next(error);
        }
    }
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
 */

router.delete("/:recipeId", authMiddleware, async (req, res, next) => {
    try {
        await recipeService.deleteOwnRecipe(
            req.params.recipeId,
            req.session!.user!.id
        );
        res.status(204).send();
    } catch (e) {
        next(e);
    }
});
export default router;
