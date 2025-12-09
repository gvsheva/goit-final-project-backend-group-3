import type { Sequelize } from "sequelize";
import {
    type CreationOptional,
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";

import { initModel } from "./init.ts";

export class Category extends Model<
    InferAttributes<Category>,
    InferCreationAttributes<Category>
> {
    declare id: string;
    declare name: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

initModel((sequelize: Sequelize) => {
    Category.init(
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.CHAR(21),
            },
            name: {
                allowNull: false,
                type: DataTypes.STRING,
            },
            createdAt: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: "Categories",
            modelName: "Category",
            timestamps: true,
        },
    );

    return Category;
});
