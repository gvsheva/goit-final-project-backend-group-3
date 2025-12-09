import type { Sequelize } from "sequelize";
import {
    type CreationOptional,
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";

import { initModel } from "./init.ts";

export class Ingredient extends Model<
    InferAttributes<Ingredient>,
    InferCreationAttributes<Ingredient>
> {
    declare id: string;
    declare name: string;
    declare description: string;
    declare img: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

initModel((sequelize: Sequelize) => {
    Ingredient.init(
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
            description: {
                allowNull: false,
                type: DataTypes.TEXT,
            },
            img: {
                allowNull: false,
                type: DataTypes.STRING(1024),
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
            tableName: "Ingredients",
            modelName: "Ingredient",
            timestamps: true,
        },
    );

    return Ingredient;
});
