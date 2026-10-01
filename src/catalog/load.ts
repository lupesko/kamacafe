import catalogJson from '../../catalog.json';
import registryJson from '../../catalog-id-registry.json';
import { resolveRecipe } from './resolve-recipe';
import type { Catalog, CatalogIdRegistry, ResolvedRecipe } from './types';

export const catalog = catalogJson as Catalog;
export const idRegistry = registryJson as CatalogIdRegistry;
export const categoriesById = new Map(catalog.categories.map((category) => [category.id, category]));
export const drinksById = new Map(catalog.drinks.map((drink) => [drink.id, drink]));
export const resolvedRecipesByDrinkId = new Map<string, ResolvedRecipe>(
  catalog.drinks.map((drink) => [drink.id, resolveRecipe(drink.id, catalog.drinks)]),
);

export const drinksForCategory = (categoryId: string) =>
  catalog.drinks.filter((drink) => drink.category === categoryId);
