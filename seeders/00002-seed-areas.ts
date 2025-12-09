import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    const { default: areas } = await import("./data/areas.json", {
        with: { type: "json" },
    });
    const { default: idMap } = await import("./data/areas-id-mapping.json", {
        with: { type: "json" },
    });
    const now = new Date();

    const rows = areas.map((area) => {
        const oldId = area._id?.$oid;
        const id = idMap[oldId];
        if (!id) {
            throw new Error(`Missing mapped id for area ${oldId}`);
        }
        return {
            id,
            name: area.name,
            createdAt: now,
            updatedAt: now,
        };
    });

    await queryInterface.bulkInsert("Areas", rows);
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Areas", {});
}
