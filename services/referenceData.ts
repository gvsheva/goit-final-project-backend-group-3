import type { InferAttributes } from "sequelize";

import { Area, Category, Ingredient } from "../models/index.ts";

export type AreaDto = Pick<InferAttributes<Area>, "id" | "name">;
export type CategoryDto = Pick<InferAttributes<Category>, "id" | "name">;
export type IngredientDto = Pick<
    InferAttributes<Ingredient>,
    "id" | "name" | "description" | "img"
>;

export class ReferenceDataService {
    async getAreas(): Promise<AreaDto[]> {
        const areas = await Area.findAll({
            attributes: ["id", "name"],
            order: [
                ["createdAt", "DESC"],
                ["id", "ASC"],
            ],
        });

        return areas.map((area) => this.toAreaDto(area));
    }

    async getCategories(): Promise<CategoryDto[]> {
        const categories = await Category.findAll({
            attributes: ["id", "name"],
            order: [["name", "ASC"]], // Сортування по алфавіту
        });

        return categories.map((category) => this.toCategoryDto(category));
    }

    async getIngredients(): Promise<IngredientDto[]> {
        const ingredients = await Ingredient.findAll({
            attributes: ["id", "name", "description", "img"],
            order: [
                ["createdAt", "DESC"],
                ["id", "ASC"],
            ],
        });

        return ingredients.map((ingredient) =>
            this.toIngredientDto(ingredient)
        );
    }

    private toAreaDto(area: Area): AreaDto {
        return area.get({ plain: true }) as AreaDto;
    }

    private toCategoryDto(category: Category): CategoryDto {
        return category.get({ plain: true }) as CategoryDto;
    }

    private toIngredientDto(ingredient: Ingredient): IngredientDto {
        return ingredient.get({ plain: true }) as IngredientDto;
    }
}

export default ReferenceDataService;
