import type { NonAttribute, Sequelize } from "sequelize";
import {
    type CreationOptional,
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";
import { initModel } from "./init.ts";

export class UserFollower extends Model<
    InferAttributes<UserFollower>,
    InferCreationAttributes<UserFollower>
> {
    declare id: string;
    declare followerId: string;
    declare createdAt: CreationOptional<Date>;
}

initModel((sequelize: Sequelize) => {
    UserFollower.init(
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.CHAR(21),
            },
            followerId: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.CHAR(21),
            },
            createdAt: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: "UserFollowers",
            modelName: "UserFollower",
            timestamps: true,
            updatedAt: false,
        },
    );

    return UserFollower;
});
