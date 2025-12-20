import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import Joi from "joi";

import authMiddleware from "../middlewares/auth.ts";
import TestimonialsService from "../services/testimonials.ts";
import { validateBody, handleServiceError } from "./utils.ts";

const router = Router();
const testimonialsService = new TestimonialsService();

const createTestimonialSchema = Joi.object({
    testimonial: Joi.string().required().min(1).max(2000),
}).options({ allowUnknown: false, abortEarly: false });

const updateTestimonialSchema = Joi.object({
    testimonial: Joi.string().required().min(1).max(2000),
}).options({ allowUnknown: false, abortEarly: false });

/**
 * @openapi
 * /testimonials:
 *   get:
 *     summary: Get all testimonials
 *     tags: [Testimonials]
 *     responses:
 *       200:
 *         description: List of testimonials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   testimonial:
 *                     type: string
 *                   ownerId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   owner:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                         nullable: true
 */
router.get(
    "/",
    async function (_req: Request, res: Response, next: NextFunction) {
        try {
            const testimonials = await testimonialsService.getTestimonials();
            res.json(testimonials);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /testimonials/me:
 *   get:
 *     summary: Get testimonials for the authenticated user
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's testimonials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   testimonial:
 *                     type: string
 *                   ownerId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   owner:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                         nullable: true
 *       401:
 *         description: Missing or invalid authorization
 */
router.get(
    "/me",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.session.user.id;
            const testimonials = await testimonialsService.getUserTestimonials(userId);
            res.json(testimonials);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /testimonials/{id}:
 *   get:
 *     summary: Get a testimonial by ID
 *     tags: [Testimonials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Testimonial details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 testimonial:
 *                   type: string
 *                 ownerId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 owner:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *       404:
 *         description: Testimonial not found
 */
router.get(
    "/:id",
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const testimonial = await testimonialsService.getTestimonial(id);

            if (!testimonial) {
                res.status(404).json({ message: "Testimonial not found" });
                return;
            }

            res.json(testimonial);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /testimonials:
 *   post:
 *     summary: Create a new testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testimonial
 *             properties:
 *               testimonial:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Testimonial created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 testimonial:
 *                   type: string
 *                 ownerId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 owner:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid authorization
 */
router.post(
    "/",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        const validated = validateBody(createTestimonialSchema, req.body, res);
        if (!validated) return;

        try {
            const userId = req.session.user.id;
            const testimonial = await testimonialsService.createTestimonial(
                userId,
                validated,
            );
            res.status(201).json(testimonial);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /testimonials/{id}:
 *   patch:
 *     summary: Update a testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testimonial
 *             properties:
 *               testimonial:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Testimonial updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 testimonial:
 *                   type: string
 *                 ownerId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 owner:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid authorization
 *       403:
 *         description: You can only update your own testimonials
 *       404:
 *         description: Testimonial not found
 */
router.patch(
    "/:id",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        const validated = validateBody(updateTestimonialSchema, req.body, res);
        if (!validated) return;

        try {
            const { id } = req.params;
            const userId = req.session.user.id;
            const testimonial = await testimonialsService.updateTestimonial(
                id,
                userId,
                validated,
            );
            res.json(testimonial);
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

/**
 * @openapi
 * /testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Testimonial deleted successfully
 *       401:
 *         description: Missing or invalid authorization
 *       403:
 *         description: You can only delete your own testimonials
 *       404:
 *         description: Testimonial not found
 */
router.delete(
    "/:id",
    authMiddleware,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;
            await testimonialsService.deleteTestimonial(id, userId);
            res.status(204).send();
        } catch (error) {
            handleServiceError(error, res, next);
        }
    },
);

export default router;
