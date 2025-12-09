import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    const { default: ingredients } = await import("./data/ingredients.json", {
        with: { type: "json" },
    });
    const { default: idMap } = await import(
        "./data/ingredients-id-mapping.json",
        { with: { type: "json" } }
    );
    const now = new Date();

    const rows = ingredients.map((ingredient) => {
        const oldId = ingredient._id;
        const id = idMap[oldId];
        if (!id) {
            throw new Error(`Missing mapped id for ingredient ${oldId}`);
        }
        return {
            id,
            name: ingredient.name,
            description: ingredient.desc,
            img: ingredient.img,
            createdAt: now,
            updatedAt: now,
        };
    });

    await queryInterface.bulkInsert("Ingredients", rows);
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Ingredients", {});
}
