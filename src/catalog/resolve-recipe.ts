import type { Drink, Recipe, ResolvedRecipe } from './types';

export function resolveRecipe(drinkId: string, drinks: readonly Drink[]): ResolvedRecipe {
  const index = new Map(drinks.map((drink) => [drink.id, drink]));
  if (!index.has(drinkId)) {
    throw new Error(`Unknown drink: ${drinkId}`);
  }

  const visiting = new Set<string>();

  const visit = (id: string): ResolvedRecipe => {
    if (visiting.has(id)) {
      throw new Error(`Recipe inheritance cycle detected at ${id}`);
    }
    const drink = index.get(id);
    if (!drink) {
      throw new Error(`Unknown base recipe: ${id}`);
    }

    visiting.add(id);
    const recipe: Recipe = drink.recipe;
    const parent = recipe.baseRecipeId ? visit(recipe.baseRecipeId) : undefined;
    const resolved: ResolvedRecipe = {
      lineage: [...(parent?.lineage ?? []), id],
      ingredients: [...(parent?.ingredients ?? []), ...structuredClone(recipe.ingredients)],
      steps: [...(parent?.steps ?? []), ...recipe.steps],
    };

    const grind = recipe.grind ?? parent?.grind;
    const scalable = recipe.scalable ?? parent?.scalable;
    const brewRatio = recipe.brewRatio ?? parent?.brewRatio;
    const waterTemperatureC = recipe.waterTemperatureC ?? parent?.waterTemperatureC;
    const espressoYieldG = recipe.espressoYieldG ?? parent?.espressoYieldG;
    const waterGuidance = recipe.waterGuidance ?? parent?.waterGuidance;
    if (grind !== undefined) resolved.grind = structuredClone(grind);
    if (scalable !== undefined) resolved.scalable = scalable;
    if (brewRatio !== undefined) resolved.brewRatio = structuredClone(brewRatio);
    if (waterTemperatureC !== undefined) resolved.waterTemperatureC = waterTemperatureC;
    if (espressoYieldG !== undefined) resolved.espressoYieldG = espressoYieldG;
    if (waterGuidance !== undefined) resolved.waterGuidance = waterGuidance;

    visiting.delete(id);
    return resolved;
  };

  return visit(drinkId);
}
