import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    const { default: categories } = await import("./data/categories.json", {
        with: { type: "json" },
    });
    const { default: idMap } = await import(
        "./data/categories-id-mapping.json",
        { with: { type: "json" } }
    );
    const now = new Date();

    const rows = categories.map((category) => {
        const oldId = category._id?.$oid;
        const id = idMap[oldId];
        if (!id) {
            throw new Error(`Missing mapped id for category ${oldId}`);
        }
        return {
            id,
            name: category.name,
            createdAt: now,
            updatedAt: now,
        };
    });

    await queryInterface.bulkInsert("Categories", rows);
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Categories", {});
}
