import type { Association, NonAttribute, Sequelize } from "sequelize";
import {
    type CreationOptional,
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";

import { initModel } from "./init.ts";
import type { Area } from "./area.ts";
import type { Category } from "./category.ts";
import type { Ingredient } from "./ingredient.ts";
import type { User } from "./user.ts";

export class Recipe extends Model<
    InferAttributes<Recipe>,
    InferCreationAttributes<Recipe>
> {
    declare id: string;
    declare name: string;
    declare description: string;
    declare instructions: string;
    declare time: number;
    declare img: string;
    declare areaId: string;
    declare categoryId: string;
    declare ownerId: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare area?: NonAttribute<Area>;
    declare category?: NonAttribute<Category>;
    declare owner?: NonAttribute<User>;
    declare ingredients?: NonAttribute<Ingredient[]>;

    declare static associations: {
        area: Association<Recipe, Area>;
        category: Association<Recipe, Category>;
        owner: Association<Recipe, User>;
        ingredients: Association<Recipe, Ingredient>;
    };
}

initModel((sequelize: Sequelize) => {
    Recipe.init(
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
            instructions: {
                allowNull: false,
                type: DataTypes.TEXT,
            },
            time: {
                allowNull: false,
                type: DataTypes.INTEGER.UNSIGNED,
            },
            img: {
                allowNull: false,
                type: DataTypes.STRING(1024),
            },
            areaId: {
                allowNull: false,
                type: DataTypes.CHAR(21),
            },
            categoryId: {
                allowNull: false,
                type: DataTypes.CHAR(21),
            },
            ownerId: {
                allowNull: false,
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
            tableName: "Recipes",
            modelName: "Recipe",
            timestamps: true,
        },
    );

    return Recipe;
});
