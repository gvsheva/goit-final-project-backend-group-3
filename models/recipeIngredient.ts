import type { Sequelize } from "sequelize";
import {
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";

import { initModel } from "./init.ts";

export class RecipeIngredient extends Model<
  InferAttributes<RecipeIngredient>,
  InferCreationAttributes<RecipeIngredient>
> {
  declare recipeId: string;
  declare ingredientId: string;
  declare measure: string | null; 
}

initModel((sequelize: Sequelize) => {
  RecipeIngredient.init(
    {
      recipeId: {
        allowNull: false,
        primaryKey: true,
        field: "id",
        type: DataTypes.CHAR(21),
      },
      ingredientId: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.CHAR(21),
      },
      measure: {
        allowNull: true,
        type: DataTypes.STRING,
      },
    },
        {
            sequelize,
            tableName: "RecipeIngredients",
            modelName: "RecipeIngredient",
            timestamps: false,
        },
    );

    return RecipeIngredient;
});
