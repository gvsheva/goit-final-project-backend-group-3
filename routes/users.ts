import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import authMiddleware from "../middlewares/auth.ts";
import UsersService from "../services/users.ts";

const router = Router();
const usersService = new UsersService();

function sendStub(res: Response, endpoint: string): void {
    res.status(501).json({ message: `${endpoint} not implemented yet` });
}

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
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
 *                   email:
 *                     type: string
 *                     format: email
 *                   avatar:
 *                     type: string
 *                     nullable: true
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Missing or invalid authorization
 */
router.get(
    "/",
    authMiddleware,
    async function (_req: Request, res: Response, next: NextFunction) {
        try {
            const users = await usersService.getUsers();
            res.json(users);
        } catch (error) {
            next(error);
        }
    },
);

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 avatar:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Missing or invalid authorization
 *       404:
 *         description: User not found
 */
router.get(
    "/:userId",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const user = await usersService.getUser(userId);

            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            res.json(user);
        } catch (error) {
            next(error);
        }
    },
);

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 avatar:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Missing or invalid authorization
 */
router.get(
    "/me",
    authMiddleware,
    function (req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.session.user;
            res.json(user);
        } catch (error) {
            next(error);
        }
    },
);

/**
 * @openapi
 * /users/me/sessions:
 *   get:
 *     summary: Get sessions for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of user sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   data:
 *                     type: object
 *                   closed:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   current:
 *                     type: boolean
 *       401:
 *         description: Missing or invalid authorization
 */
router.get(
    "/me/sessions",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.session?.userId;
            const sessions = await usersService.getUserSessions(userId);
            res.json(sessions);
        } catch (error) {
            next(error);
        }
    },
);

/**
 * @openapi
 * /users/me/sessions/{sessionId}:
 *   get:
 *     summary: Get a specific session for the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details
 *       401:
 *         description: Missing or invalid authorization
 *       404:
 *         description: Session not found
 */
router.get(
    "/me/sessions/:sessionId",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            const userId = req.session.user.id;
            const session = await usersService.getUserSession(
                userId,
                sessionId,
            );
            if (!session) {
                res.status(404).json({ message: "Session not found" });
                return;
            }
            res.json(session);
        } catch (error) {
            next(error);
        }
    },
);

/**
 * @openapi
 * /users/me/sessions/{sessionId}:
 *   delete:
 *     summary: Close a specific session for the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Session closed
 *       401:
 *         description: Missing or invalid authorization
 *       404:
 *         description: Session not found
 */
router.delete(
    "/me/sessions/:sessionId",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            const userId = req.session.user.id;
            const closed = await usersService.closeUserSession(
                userId,
                sessionId,
            );
            if (!closed) {
                res.status(404).json({ message: "Session not found" });
                return;
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
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
