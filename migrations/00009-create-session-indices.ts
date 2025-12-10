import type { DataTypes, QueryInterface } from "sequelize";

export async function up(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.addIndex("Sessions", ["userId", "closed"], {
        name: "Sessions_userId_closed_idx",
        concurrently: true,
    });
    await queryInterface.addIndex("Sessions", ["createdAt"], {
        name: "Sessions_createdAt_idx",
        concurrently: true,
    });
}

export async function down(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.removeIndex("Sessions", "Sessions_userId_closed_idx");
    await queryInterface.removeIndex("Sessions", "Sessions_createdAt_idx");
}
