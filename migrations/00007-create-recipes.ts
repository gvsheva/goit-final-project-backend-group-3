import type { DataTypes, QueryInterface } from "sequelize";

export async function up(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.sequelize.transaction((transaction) => {
        return Promise.all([
            queryInterface.createTable(
                "Recipes",
                {
                    id: {
                        allowNull: false,
                        primaryKey: true,
                        type: Sequelize.CHAR(21),
                    },
                    name: {
                        allowNull: false,
                        type: Sequelize.STRING,
                    },
                    description: {
                        allowNull: false,
                        type: Sequelize.TEXT,
                    },
                    instructions: {
                        allowNull: false,
                        type: Sequelize.TEXT,
                    },
                    time: {
                        allowNull: false,
                        type: Sequelize.INTEGER,
                    },
                    img: {
                        allowNull: false,
                        type: Sequelize.STRING(1024),
                    },
                    areaId: {
                        allowNull: false,
                        type: Sequelize.CHAR(21),
                        references: {
                            model: "Areas",
                            key: "id",
                        },
                    },
                    categoryId: {
                        allowNull: false,
                        type: Sequelize.CHAR(21),
                        references: {
                            model: "Categories",
                            key: "id",
                        },
                    },
                    ownerId: {
                        allowNull: false,
                        type: Sequelize.CHAR(21),
                        references: {
                            model: "Users",
                            key: "id",
                        },
                    },
                    createdAt: {
                        allowNull: false,
                        type: Sequelize.DATE,
                    },
                    updatedAt: {
                        allowNull: false,
                        type: Sequelize.DATE,
                    },
                },
                { transaction },
            ),
            queryInterface.createTable(
                "RecipeIngredients",
                {
                    id: {
                        allowNull: false,
                        primaryKey: true,
                        type: Sequelize.CHAR(21),
                        references: {
                            model: "Recipes",
                            key: "id",
                        },
                    },
                    ingredientId: {
                        allowNull: false,
                        primaryKey: true,
                        type: Sequelize.CHAR(21),
                        references: {
                            model: "Ingredients",
                            key: "id",
                        },
                    },
                },
                { transaction },
            ),
        ]);
    });
}

export async function down(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.sequelize.transaction((transaction) => {
        return Promise.all([
            queryInterface.dropTable("RecipeIngredients", { transaction }),
            queryInterface.dropTable("Recipes", { transaction }),
        ]);
    });
}
