import { Sequelize, type Options } from "sequelize";
import dbConfig from "../config/db.ts";
import { Area } from "./area.ts";
import { Category } from "./category.ts";
import { Ingredient } from "./ingredient.ts";
import { Recipe } from "./recipe.ts";
import { RecipeIngredient } from "./recipeIngredient.ts";
import { Session } from "./session.ts";
import { Testimonial } from "./testimonial.ts";
import { UserFollower } from "./userFollower.ts";
import { User } from "./user.ts";

import init from "./init.ts";

type ConfigMap = Record<string, Options>;
const env = process.env.NODE_ENV || "development";
const envConfig = (dbConfig as ConfigMap)[env];

if (!envConfig) {
    throw new Error(`Database config for environment "${env}" not found`);
}

const { database, username, password, ...rest } = envConfig;

// Centralized Sequelize instance shared by all models.
const sequelize = new Sequelize(database, username, password, {
    logging: false,
    ...rest,
});

init(sequelize);

User.hasMany(Session, { foreignKey: "userId", as: "sessions" });
Session.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Recipe, { foreignKey: "ownerId", as: "recipes" });
Recipe.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

Recipe.belongsToMany(Ingredient, {
    through: RecipeIngredient,
    as: "ingredients",
    foreignKey: { name: "recipeId", field: "id" },
    otherKey: "ingredientId",
});

User.hasMany(Testimonial, { foreignKey: "ownerId", as: "testimonials" });
Testimonial.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

User.belongsToMany(User, {
    through: UserFollower,
    as: "followers",
    foreignKey: "id",
    otherKey: "followerId",
});
User.belongsToMany(User, {
    through: UserFollower,
    as: "following",
    foreignKey: "followerId",
    otherKey: "id",
});

export {
    sequelize,
    Sequelize,
    Area,
    Category,
    Ingredient,
    Recipe,
    RecipeIngredient,
    Session,
    Testimonial,
    User,
    UserFollower,
};
