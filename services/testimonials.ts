import type { InferAttributes } from "sequelize";
import { nanoid } from "nanoid";

import { Testimonial, User } from "../models/index.ts";
import { ServiceError } from "./errors.ts";

export type TestimonialDto = Pick<
    InferAttributes<Testimonial>,
    "id" | "testimonial" | "ownerId" | "createdAt" | "updatedAt"
> & {
    owner: {
        id: string;
        name: string;
        avatar: string | null;
    };
};

export interface CreateTestimonialPayload {
    testimonial: string;
}

export interface UpdateTestimonialPayload {
    testimonial: string;
}

export class TestimonialsService {
    async getTestimonials(): Promise<TestimonialDto[]> {
        const testimonials = await Testimonial.findAll({
            include: [
                {
                    association: Testimonial.associations.owner,
                    attributes: ["id", "name", "avatar"],
                },
            ],
            order: [["createdAt", "DESC"], ["id", "ASC"]],
        });

        return testimonials.map((t) => this.toTestimonialDto(t));
    }

    async getUserTestimonials(userId: string): Promise<TestimonialDto[]> {
        const testimonials = await Testimonial.findAll({
            where: { ownerId: userId },
            include: [
                {
                    association: Testimonial.associations.owner,
                    attributes: ["id", "name", "avatar"],
                },
            ],
            order: [["createdAt", "DESC"], ["id", "ASC"]],
        });

        return testimonials.map((t) => this.toTestimonialDto(t));
    }

    async getTestimonial(testimonialId: string): Promise<TestimonialDto | null> {
        const testimonial = await Testimonial.findByPk(testimonialId, {
            include: [
                {
                    association: Testimonial.associations.owner,
                    attributes: ["id", "name", "avatar"],
                },
            ],
        });

        if (!testimonial) return null;

        return this.toTestimonialDto(testimonial);
    }

    async createTestimonial(
        userId: string,
        payload: CreateTestimonialPayload,
    ): Promise<TestimonialDto> {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ServiceError("User not found", 404, "USER_NOT_FOUND");
        }

        const testimonial = await Testimonial.create({
            id: nanoid(),
            testimonial: payload.testimonial,
            ownerId: userId,
        });

        const created = await Testimonial.findByPk(testimonial.id, {
            include: [
                {
                    association: Testimonial.associations.owner,
                    attributes: ["id", "name", "avatar"],
                },
            ],
        });

        return this.toTestimonialDto(created!);
    }

    async updateTestimonial(
        testimonialId: string,
        userId: string,
        payload: UpdateTestimonialPayload,
    ): Promise<TestimonialDto> {
        const testimonial = await Testimonial.findByPk(testimonialId, {
            include: [
                {
                    association: Testimonial.associations.owner,
                    attributes: ["id", "name", "avatar"],
                },
            ],
        });

        if (!testimonial) {
            throw new ServiceError("Testimonial not found", 404, "TESTIMONIAL_NOT_FOUND");
        }

        if (testimonial.ownerId !== userId) {
            throw new ServiceError(
                "You can only update your own testimonials",
                403,
                "FORBIDDEN",
            );
        }

        await testimonial.update({ testimonial: payload.testimonial });

        return this.toTestimonialDto(testimonial);
    }

    async deleteTestimonial(testimonialId: string, userId: string): Promise<void> {
        const testimonial = await Testimonial.findByPk(testimonialId);

        if (!testimonial) {
            throw new ServiceError("Testimonial not found", 404, "TESTIMONIAL_NOT_FOUND");
        }

        if (testimonial.ownerId !== userId) {
            throw new ServiceError(
                "You can only delete your own testimonials",
                403,
                "FORBIDDEN",
            );
        }

        await testimonial.destroy();
    }

    private toTestimonialDto(testimonial: Testimonial): TestimonialDto {
        return {
            id: testimonial.id,
            testimonial: testimonial.testimonial,
            ownerId: testimonial.ownerId,
            createdAt: testimonial.createdAt,
            updatedAt: testimonial.updatedAt,
            owner: {
                id: testimonial.owner!.id,
                name: testimonial.owner!.name,
                avatar: testimonial.owner!.avatar,
            },
        };
    }
}

export default TestimonialsService;
