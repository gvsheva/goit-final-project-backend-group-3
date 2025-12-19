import {
    Router,
    type Request,
    type Response,
} from "express";

const router = Router();

/**
 * @openapi
 * /:
 *   get:
 *     summary: Get the home page
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/", (_req: Request, res: Response) => {
    res.send("Welcome to the Recipe API!");
});

export default router;
