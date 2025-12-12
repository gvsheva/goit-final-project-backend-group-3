import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import authMiddleware from "../middlewares/auth.ts";
import { uploadSingleImage } from "../middlewares/upload.ts";
import * as recipeController from "../controllers/recipeController.ts";

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
    "/own",
    authMiddleware,
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "GET /recipes/own");
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
    recipeController.createRecipe,
);

router.delete(
    "/:recipeId",
    authMiddleware,
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "DELETE /recipes/:recipeId");
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

export default router;

