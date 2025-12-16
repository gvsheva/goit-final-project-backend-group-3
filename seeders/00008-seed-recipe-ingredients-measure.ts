import type { QueryInterface } from "sequelize";

type IngredientRow = {
    id: string;
    ingredientId: string;
    measure: string | null;
};

export async function up(queryInterface: QueryInterface) {
    const table = await queryInterface.describeTable("RecipeIngredients");
    if (!("measure" in table)) {
        return;
    }

    const { default: recipes } = await import("./data/recipes.json", {
        with: { type: "json" },
    });
    const { default: recipeIdMap } = await import(
        "./data/recipes-id-mapping.json",
        { with: { type: "json" } },
    );
    const { default: ingredientIdMap } = await import(
        "./data/ingredients-id-mapping.json",
        { with: { type: "json" } },
    );

    const seen = new Set<string>();
    const rows: IngredientRow[] = [];

    for (const recipe of recipes as any[]) {
        const oldRecipeId = recipe._id?.$oid;
        const recipeId = recipeIdMap[oldRecipeId];
        if (!recipeId) continue;

        for (const ing of (recipe.ingredients ?? []) as any[]) {
            const ingredientId = ingredientIdMap[ing.id];
            if (!ingredientId) continue;

            const key = `${recipeId}:${ingredientId}`;
            if (seen.has(key)) continue;
            seen.add(key);

            rows.push({
                id: recipeId,
                ingredientId,
                measure: ing.measure ?? null,
            });
        }
    }
    for (const row of rows) {
        await queryInterface.bulkUpdate(
            "RecipeIngredients",
            { measure: row.measure },
            { id: row.id, ingredientId: row.ingredientId },
        );
    }
}

export async function down(queryInterface: QueryInterface) {
    const table = await queryInterface.describeTable("RecipeIngredients");
    if (!("measure" in table)) return;

    await queryInterface.bulkUpdate("RecipeIngredients", { measure: null }, {});
}
