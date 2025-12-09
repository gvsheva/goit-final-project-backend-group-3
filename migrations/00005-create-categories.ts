import type { DataTypes, QueryInterface } from "sequelize";

export async function up(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.createTable("Categories", {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.CHAR(21),
        },
        name: {
            allowNull: false,
            type: Sequelize.STRING,
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
        },
    });
}

export async function down(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.dropTable("Categories");
}
