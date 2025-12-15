import type { Sequelize } from "sequelize";
import {
    type CreationOptional,
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";
import { initModel } from "./init.ts";

export class FavoriteRecipe extends Model<
    InferAttributes<FavoriteRecipe>,
    InferCreationAttributes<FavoriteRecipe>
> {
    declare userId: string;
    declare recipeId: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

initModel((sequelize: Sequelize) => {
    FavoriteRecipe.init(
        {
            userId: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.CHAR(21),
            },
            recipeId: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.CHAR(21),
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
            tableName: "FavoriteRecipes",
            modelName: "FavoriteRecipe",
            timestamps: true,
        },
    );

    return FavoriteRecipe;
});
