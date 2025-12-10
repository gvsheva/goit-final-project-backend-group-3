import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import authMiddleware from "../middlewares/auth.ts";

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

router.post(
    "/",
    authMiddleware,
    function (_req: Request, res: Response, _next: NextFunction) {
        sendStub(res, "POST /recipes");
    },
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
