import type { DataTypes, QueryInterface } from "sequelize";

export async function up(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.addIndex("Users", ["createdAt"], {
        name: "Users_createdAt_idx",
        concurrently: true,
    });
}

export async function down(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.removeIndex("Users", "Users_createdAt_idx");
}
