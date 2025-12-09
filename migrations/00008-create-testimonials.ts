import type { DataTypes, QueryInterface } from "sequelize";

export async function up(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.createTable("Testimonials", {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.CHAR(21),
        },
        testimonial: {
            allowNull: false,
            type: Sequelize.TEXT,
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
    });
}

export async function down(
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
) {
    await queryInterface.dropTable("Testimonials");
}
