import Joi from "joi";
import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

import { AuthService } from "../services/auth.ts";
import authMiddleware from "../middlewares/auth.ts";
import { validateBody, handleServiceError } from "./utils.ts";

const router = Router();
const authService = new AuthService();

const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    avatar: Joi.string().uri().optional(),
    sessionData: Joi.object().unknown(true).optional(),
}).options({ allowUnknown: false, abortEarly: false });

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    sessionData: Joi.object().unknown(true).optional(),
}).options({ allowUnknown: false, abortEarly: false });

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
        const validated = validateBody(registerSchema, req.body, res);
        if (!validated) return;
        const { name, email, password, avatar, sessionData } = validated;

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
            handleServiceError(error, res, next);
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
        const validated = validateBody(loginSchema, req.body, res);
        if (!validated) return;
        const { email, password, sessionData } = validated;

        try {
            const result = await authService.login({
                email,
                password,
                sessionData: buildSessionData(req, sessionData),
            });

            res.status(200).json(result);
        } catch (error) {
            handleServiceError(error, res, next);
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
            handleServiceError(error, res, next);
        }
    },
);

export default router;
