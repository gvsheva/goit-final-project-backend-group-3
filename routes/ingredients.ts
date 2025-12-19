import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import ReferenceDataService from "../services/referenceData.ts";
import { handleServiceError } from "./utils.ts";

const router = Router();
const referenceDataService = new ReferenceDataService();

/**
 * @openapi
 * /ingredients:
 *   get:
 *     summary: Get all ingredients
 *     tags: [Ingredients]
 *     responses:
 *       200:
 *         description: List of available ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   img:
 *                     type: string
 */
router.get(
    "/",
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const ingredients = await referenceDataService.getIngredients();
            res.json(ingredients);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

export default router;
