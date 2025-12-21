import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import authMiddleware from "../middlewares/auth.ts";
import UsersService from "../services/users.ts";
import { uploadSingleImage } from "../middlewares/upload.ts";
import { handleServiceError } from "./utils.ts";

const router = Router();
const usersService = new UsersService();


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
            handleServiceError(error, res, next);
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
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.session.user;
            const userData = await usersService.getCurrentUser(user.id);
            res.json(userData);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /users/{userId}/followers:
 *   get:
 *     summary: Get followers of a specific user
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
 *         description: List of followers
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get(
    "/:userId/followers",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const followers = await usersService.getFollowers(userId);
            res.json(followers);
        } catch (error) {
            handleServiceError(error, res, next);
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
            handleServiceError(error, res, next);
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
            const userId = req.session.user.id;
            const sessions = await usersService.getUserSessions(userId);
            res.json(sessions);
        } catch (error) {
            handleServiceError(error, res, next);
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
            handleServiceError(error, res, next);
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
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /users/me/avatar:
 *   patch:
 *     summary: Update the current user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               img:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *                   example: "/public/avatar/user123-1734455.jpg"
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Missing or invalid authorization
 */
router.patch(
    "/me/avatar",
    authMiddleware,
    uploadSingleImage,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                res.status(400).json({ message: "No file uploaded" });
                return;
            }

            const userId = req.session!.user!.id;
            const result = await usersService.updateAvatar(userId, req.file.path);
            res.json(result);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /users/me/followers:
 *   get:
 *     summary: Get followers of the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of followers
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/me/followers",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.session.user.id;
            const followers = await usersService.getFollowers(userId);
            res.json(followers);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /users/me/following:
 *   get:
 *     summary: Get users that the authenticated user is following
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of followed users
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/me/following",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.session.user.id;
            const following = await usersService.getFollowing(userId);
            res.json(following);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /users/{userId}/follow:
 *   post:
 *     summary: Follow a user
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
 *       204:
 *         description: Successfully followed
 *       400:
 *         description: Cannot follow yourself
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
    "/:userId/follow",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const followerId = req.session.user.id;
            const { userId } = req.params;
            await usersService.followUser(followerId, userId);
            res.status(204).send();
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /users/{userId}/follow:
 *   delete:
 *     summary: Unfollow a user
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
 *       204:
 *         description: Successfully unfollowed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not following this user
 */
router.delete(
    "/:userId/follow",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const followerId = req.session.user.id;
            const { userId } = req.params;
            await usersService.unfollowUser(followerId, userId);
            res.status(204).send();
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

export default router;
