import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import authMiddleware from "../middlewares/auth.ts";
import { uploadSingleImage } from "../middlewares/upload.ts";
import * as recipeService from "../services/recipeService.ts";

const router = Router();

function sendStub(res: Response, endpoint: string): void {
    res.status(501).json({ message: `${endpoint} not implemented yet` });
}

router.get(
    "/",
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "GET /recipes");
    },
);

router.get(
    "/popular",
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "GET /recipes/popular");
    },
);


router.get(
    "/favorites",
    authMiddleware,
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "GET /recipes/favorites");
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
 *               - img
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
    },
);


router.post(
    "/:recipeId/favorite",
    authMiddleware,
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "POST /recipes/:recipeId/favorite");
    },
);

router.delete(
    "/:recipeId/favorite",
    authMiddleware,
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "DELETE /recipes/:recipeId/favorite");
    },
);

router.get(
    "/:recipeId",
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "GET /recipes/:recipeId");
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
 */

router.get("/own", authMiddleware, async (req, res, next ) => {
    try {
        const recipes = await recipeService.getOwnRecipes(
            req.session!.user!.id
        )
        res.json(recipes);
    } catch (e) {
        next(e);
    }
});

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
        )
        res.status(204).send();
    } catch (e) {
        next(e);
    }

})
export default router;

