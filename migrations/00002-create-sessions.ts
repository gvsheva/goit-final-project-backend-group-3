import type { DataTypes, QueryInterface } from "sequelize";

export async function up(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.createTable("Sessions", {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.CHAR(21),
        },
        userId: {
            allowNull: false,
            type: Sequelize.CHAR(21),
            references: {
                model: "Users",
                key: "id",
            },
        },
        token: {
            allowNull: false,
            type: Sequelize.STRING,
        },
        data: {
            allowNull: false,
            type: Sequelize.JSONB,
            defaultValue: {},
        },
        closed: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
            defaultValue: false,
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
    await queryInterface.dropTable("Sessions");
}
