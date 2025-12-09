import type { Association, NonAttribute, Sequelize } from "sequelize";
import {
    type CreationOptional,
    DataTypes,
    type InferAttributes,
    type InferCreationAttributes,
    Model,
} from "sequelize";

import { initModel } from "./init.ts";
import type { User } from "./user.ts";

export class Testimonial extends Model<
    InferAttributes<Testimonial>,
    InferCreationAttributes<Testimonial>
> {
    declare id: string;
    declare testimonial: string;
    declare ownerId: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare owner?: NonAttribute<User>;

    declare static associations: {
        owner: Association<Testimonial, User>;
    };
}

initModel((sequelize: Sequelize) => {
    Testimonial.init(
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.CHAR(21),
            },
            testimonial: {
                allowNull: false,
                type: DataTypes.TEXT,
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
            tableName: "Testimonials",
            modelName: "Testimonial",
            timestamps: true,
        },
    );

    return Testimonial;
});
