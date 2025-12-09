import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    const { default: testimonials } = await import("./data/testimonials.json", {
        with: { type: "json" },
    });
    const { default: testimonialIdMap } = await import(
        "./data/testimonials-id-mapping.json",
        { with: { type: "json" } }
    );
    const { default: userIdMap } = await import(
        "./data/users-id-mapping.json",
        { with: { type: "json" } }
    );
    const now = new Date();

    const rows = testimonials.map((testimonial) => {
        const oldId = testimonial._id?.$oid;
        const id = testimonialIdMap[oldId];
        if (!id) {
            throw new Error(`Missing mapped id for testimonial ${oldId}`);
        }

        const ownerId = userIdMap[testimonial.owner?.$oid];
        if (!ownerId) {
            throw new Error(`Missing mapped owner id for testimonial ${oldId}`);
        }

        return {
            id,
            testimonial: testimonial.testimonial,
            ownerId,
            createdAt: now,
            updatedAt: now,
        };
    });

    await queryInterface.bulkInsert("Testimonials", rows);
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Testimonials", {});
}
