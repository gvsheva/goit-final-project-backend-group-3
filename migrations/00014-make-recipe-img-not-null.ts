import type { QueryInterface, DataTypes } from "sequelize";

const PLACEHOLDER_IMG = "/public/recipes/default.png";

export async function up(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes
) {
    await queryInterface.sequelize.query(`
        UPDATE "Recipes"
        SET "img" = '${PLACEHOLDER_IMG}'
        WHERE "img" IS NULL
    `);

    await queryInterface.changeColumn("Recipes", "img", {
        allowNull: false,
        type: Sequelize.STRING(1024),
    });
}

export async function down(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes
) {
    await queryInterface.changeColumn("Recipes", "img", {
        allowNull: true,
        type: Sequelize.STRING(1024),
    });
}
