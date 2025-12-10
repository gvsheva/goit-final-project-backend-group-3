import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import ReferenceDataService from "../services/referenceData.ts";

const router = Router();
const referenceDataService = new ReferenceDataService();

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Get all recipe categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of available categories
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
 */
router.get(
    "/",
    async function (_req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await referenceDataService.getCategories();
            res.json(categories);
        } catch (error) {
            next(error);
        }
    },
);

export default router;
