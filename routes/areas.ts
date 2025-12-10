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
 * /areas:
 *   get:
 *     summary: Get all recipe areas
 *     tags: [Areas]
 *     responses:
 *       200:
 *         description: List of available areas
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
            const areas = await referenceDataService.getAreas();
            res.json(areas);
        } catch (error) {
            next(error);
        }
    },
);

export default router;
