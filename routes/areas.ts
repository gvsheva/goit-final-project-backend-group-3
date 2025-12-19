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
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const areas = await referenceDataService.getAreas();
            res.json(areas);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

export default router;
