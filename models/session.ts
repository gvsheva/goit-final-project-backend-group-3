import type { Association, Sequelize } from "sequelize";
import {
    type CreationOptional,
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";
import type { User } from "./user.ts";
import { initModel } from "./init.ts";

export class Session extends Model<
    InferAttributes<Session>,
    InferCreationAttributes<Session>
> {
    declare id: string;
    declare userId: string;
    declare data: Record<string, unknown>;
    declare closed: boolean;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare user?: User;

    declare static associations: {
        user: Association<Session, User>;
    };
}

initModel((sequelize: Sequelize)=> {
    Session.init(
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.CHAR(21),
            },
            userId: {
                allowNull: false,
                type: DataTypes.CHAR(21),
            },
            data: {
                allowNull: false,
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            closed: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
                defaultValue: false,
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
            tableName: "Sessions",
            modelName: "Session",
            timestamps: true,
        },
    );

    return Session;
});
