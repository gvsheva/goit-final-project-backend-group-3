import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    const { default: users } = await import("./data/users.json", {
        with: { type: "json" },
    });
    const { default: idMap } = await import("./data/users-id-mapping.json", {
        with: { type: "json" },
    });
    const now = new Date();

    const rows = users.map((user) => {
        const oldId = user._id?.$oid;
        const id = idMap[oldId];
        if (!id) {
            throw new Error(`Missing mapped id for user ${oldId}`);
        }
        return {
            id,
            name: user.name,
            email: user.email,
            password: "password",
            createdAt: now,
            updatedAt: now,
        };
    });

    await queryInterface.bulkInsert("Users", rows);
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Users", {});
}
