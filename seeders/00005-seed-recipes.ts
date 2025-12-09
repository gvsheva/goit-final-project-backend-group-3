import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    const { default: recipes } = await import("./data/recipes.json", {
        with: { type: "json" },
    });
    const { default: recipeIdMap } = await import(
        "./data/recipes-id-mapping.json",
        { with: { type: "json" } }
    );
    const { default: userIdMap } = await import(
        "./data/users-id-mapping.json",
        { with: { type: "json" } }
    );
    const { default: areaIdMap } = await import(
        "./data/areas-id-mapping.json",
        { with: { type: "json" } }
    );
    const { default: categoryIdMap } = await import(
        "./data/categories-id-mapping.json",
        { with: { type: "json" } }
    );

    const { default: areas } = await import("./data/areas.json", {
        with: { type: "json" },
    });
    const { default: categories } = await import("./data/categories.json", {
        with: { type: "json" },
    });

    const areaByName = new Map<string, string>(
        areas.map((area) => {
            const oldId = area._id?.$oid;
            const newId = areaIdMap[oldId];
            if (!newId) {
                throw new Error(`Missing mapped id for area ${oldId}`);
            }
            return [area.name, newId];
        }),
    );

    const categoryByName = new Map<string, string>(
        categories.map((category) => {
            const oldId = category._id?.$oid;
            const newId = categoryIdMap[oldId];
            if (!newId) {
                throw new Error(`Missing mapped id for category ${oldId}`);
            }
            return [category.name, newId];
        }),
    );

    const now = new Date();
    const rows = recipes.map((recipe) => {
        const oldRecipeId = recipe._id?.$oid;
        const id = recipeIdMap[oldRecipeId];
        if (!id) {
            throw new Error(`Missing mapped id for recipe ${oldRecipeId}`);
        }

        const ownerId = userIdMap[recipe.owner?.$oid];
        if (!ownerId) {
            throw new Error(
                `Missing mapped owner id for ${recipe.owner?.$oid}`,
            );
        }

        const areaId = areaByName.get(recipe.area);
        if (!areaId) {
            throw new Error(`Missing area id for name "${recipe.area}"`);
        }

        const categoryId = categoryByName.get(recipe.category);
        if (!categoryId) {
            throw new Error(
                `Missing category id for name "${recipe.category}"`,
            );
        }

        const time = Number.parseInt(String(recipe.time), 10);
        if (Number.isNaN(time)) {
            throw new Error(`Invalid time for recipe ${oldRecipeId}`);
        }

        return {
            id,
            name: recipe.title,
            description: recipe.description,
            instructions: recipe.instructions,
            time,
            img: recipe.thumb,
            areaId,
            categoryId,
            ownerId,
            createdAt: now,
            updatedAt: now,
        };
    });

    await queryInterface.bulkInsert("Recipes", rows);
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Recipes", {});
}
