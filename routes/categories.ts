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
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await referenceDataService.getCategories();
            res.json(categories);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

export default router;
