import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import { AuthService, AuthServiceError } from "../services/auth.ts";
import authMiddleware from "../middlewares/auth.ts";

const router = Router();
const authService = new AuthService();

function handleAuthError(
    error: unknown,
    res: Response,
    next: NextFunction,
): void {
    if (error instanceof AuthServiceError) {
        res.status(error.status).json({
            message: error.message,
            code: error.code,
        });
        return;
    }

    next(error);
}

function buildSessionData(
    req: Request,
    extra: Record<string, unknown> | undefined,
): Record<string, unknown> {
    return {
        ip: req.ip,
        userAgent: req.get("user-agent") ?? null,
        ...extra,
    };
}

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               avatar:
 *                 type: string
 *                 format: uri
 *               sessionData:
 *                 type: object
 *     responses:
 *       201:
 *         description: User registered and session created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post(
    "/register",
    async function (req: Request, res: Response, next: NextFunction) {
        const { name, email, password, avatar, sessionData } = req.body ?? {};

        if (!name || !email || !password) {
            res.status(400).json({
                message: "name, email, and password are required",
            });
            return;
        }

        try {
            const result = await authService.register({
                name,
                email,
                password,
                avatar,
                sessionData: buildSessionData(req, sessionData),
            });

            res.status(201).json(result);
        } catch (error) {
            handleAuthError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               sessionData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post(
    "/login",
    async function (req: Request, res: Response, next: NextFunction) {
        const { email, password, sessionData } = req.body ?? {};

        if (!email || !password) {
            res.status(400).json({
                message: "email and password are required",
            });
            return;
        }

        try {
            const result = await authService.login({
                email,
                password,
                sessionData: buildSessionData(req, sessionData),
            });

            res.status(200).json(result);
        } catch (error) {
            handleAuthError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Close the active session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Session closed
 *       400:
 *         description: Missing token
 */
router.post(
    "/logout",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        const sessionId = req.session.id;

        if (!sessionId) {
            res.status(400).json({
                message: "Authorization token is required",
            });
            return;
        }

        try {
            await authService.logout(sessionId);
            res.status(204).send();
        } catch (error) {
            handleAuthError(error, res, next);
        }
    },
);

export default router;
