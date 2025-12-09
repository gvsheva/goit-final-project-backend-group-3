import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
    const { default: recipes } = await import("./data/recipes.json", {
        with: { type: "json" },
    });
    const { default: recipeIdMap } = await import(
        "./data/recipes-id-mapping.json",
        { with: { type: "json" } }
    );
    const { default: ingredientIdMap } = await import(
        "./data/ingredients-id-mapping.json",
        { with: { type: "json" } }
    );

    const seen = new Set<string>();
    const rows: Array<{ id: string; ingredientId: string }> = [];

    for (const recipe of recipes) {
        const oldRecipeId = recipe._id?.$oid;
        const recipeId = recipeIdMap[oldRecipeId];
        if (!recipeId) {
            throw new Error(`Missing mapped id for recipe ${oldRecipeId}`);
        }

        for (const ingredient of recipe.ingredients) {
            const ingredientId = ingredientIdMap[ingredient.id];
            if (!ingredientId) {
                throw new Error(
                    `Missing mapped ingredient id for ${ingredient.id}`,
                );
            }
            const key = `${recipeId}:${ingredientId}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            rows.push({ id: recipeId, ingredientId });
        }
    }

    await queryInterface.bulkInsert("RecipeIngredients", rows);
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("RecipeIngredients", {});
}
