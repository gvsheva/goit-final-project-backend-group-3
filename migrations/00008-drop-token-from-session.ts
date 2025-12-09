import type { DataTypes, QueryInterface } from "sequelize";

export async function up(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.removeColumn("Sessions", "token");
}

export async function down(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.addColumn("Sessions", "token", {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
    });
}
