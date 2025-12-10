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
    "/me",
    authMiddleware,
    function (req: Request, res: Response, next: NextFunction) {
        sendStub(res, "GET /users/me");
    },
);

router.get(
    "/:userId",
    authMiddleware,
    function (req: Request, res: Response, next: NextFunction) {
        sendStub(res, "GET /users/:userId");
    },
);

router.patch(
    "/me/avatar",
    authMiddleware,
    function (req: Request, res: Response, next: NextFunction) {
        sendStub(res, "PATCH /users/me/avatar");
    },
);

router.get(
    "/me/followers",
    authMiddleware,
    function (req: Request, res: Response, next: NextFunction) {
        sendStub(res, "GET /users/me/followers");
    },
);

router.get(
    "/me/following",
    authMiddleware,
    function (req: Request, res: Response, next: NextFunction) {
        sendStub(res, "GET /users/me/following");
    },
);

router.post(
    "/:userId/follow",
    authMiddleware,
    function (req: Request, res: Response, next: NextFunction) {
        sendStub(res, "POST /users/:userId/follow");
    },
);

router.delete(
    "/:userId/follow",
    authMiddleware,
    function (req: Request, res: Response, next: NextFunction) {
        sendStub(res, "DELETE /users/:userId/follow");
    },
);

export default router;
