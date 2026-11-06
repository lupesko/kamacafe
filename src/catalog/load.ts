import catalogJson from '../../catalog.json';
import registryJson from '../../catalog-id-registry.json';
import { resolveRecipe } from './resolve-recipe';
import type { Catalog, CatalogIdRegistry, ResolvedRecipe, RoastLevel } from './types';

export const catalog = catalogJson as Catalog;
export const idRegistry = registryJson as CatalogIdRegistry;
export const categoriesById = new Map(catalog.categories.map((category) => [category.id, category]));
export const drinksById = new Map(catalog.drinks.map((drink) => [drink.id, drink]));
export const resolvedRecipesByDrinkIdAndRoast = new Map<string, Record<RoastLevel, ResolvedRecipe>>(
  catalog.drinks.map((drink) => [drink.id, {
    light: resolveRecipe(drink.id, catalog.drinks, 'light'),
    medium: resolveRecipe(drink.id, catalog.drinks, 'medium'),
    dark: resolveRecipe(drink.id, catalog.drinks, 'dark'),
  }]),
);
export const resolvedRecipesByDrinkId = new Map<string, ResolvedRecipe>(
  [...resolvedRecipesByDrinkIdAndRoast].map(([drinkId, recipes]) => [drinkId, recipes.medium]),
);

export const drinksForCategory = (categoryId: string) =>
  catalog.drinks.filter((drink) => drink.category === categoryId);
