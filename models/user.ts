import type { Association, NonAttribute, Sequelize } from "sequelize";
import {
    type CreationOptional,
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";

import { initModel } from "./init.ts";
import type { Session } from "./session.ts";
import type { Recipe } from "./recipe.ts";

export class User extends Model<
    InferAttributes<User>,
    InferCreationAttributes<User>
> {
    declare id: string;
    declare name: string;
    declare email: string;
    declare password: string;
    declare avatar: CreationOptional<string>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare sessions?: NonAttribute<Session[]>;
    declare following?: NonAttribute<User[]>;
    declare followers?: NonAttribute<User[]>;
    declare recipes?: NonAttribute<Recipe[]>;

    declare static associations: {
        sessions: Association<User, Session>;
        following: Association<User, User>;
        followers: Association<User, User>;
        recipes: Association<User, Recipe>;
    };
}

initModel((sequelize: Sequelize) => {
    User.init(
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
            email: {
                allowNull: false,
                type: DataTypes.STRING,
                unique: true,
            },
            password: {
                allowNull: false,
                type: DataTypes.STRING,
            },
            avatar: {
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
            tableName: "Users",
            modelName: "User",
            timestamps: true,
        },
    );

    return User;
});
