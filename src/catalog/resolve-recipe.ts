import type {
  Drink,
  Recipe,
  ResolvedRecipe,
  ResolvedRoastRecommendation,
  RoastLevel,
  TemperatureGuidance,
} from './types';

function cloneTemperature(guidance: TemperatureGuidance): TemperatureGuidance {
  return typeof guidance === 'number' ? guidance : { ...guidance };
}

export function resolveRecipe(
  drinkId: string,
  drinks: readonly Drink[],
  roastLevel: RoastLevel = 'medium',
): ResolvedRecipe {
  const index = new Map(drinks.map((drink) => [drink.id, drink]));
  if (!index.has(drinkId)) throw new Error(`Unknown drink: ${drinkId}`);

  const visiting = new Set<string>();

  const visit = (id: string): ResolvedRecipe => {
    if (visiting.has(id)) throw new Error(`Recipe inheritance cycle detected at ${id}`);
    const drink = index.get(id);
    if (!drink) throw new Error(`Unknown base recipe: ${id}`);

    visiting.add(id);
    const recipe: Recipe = drink.recipe;
    const parent = recipe.baseRecipeId ? visit(recipe.baseRecipeId) : undefined;
    const selected = recipe.roastRecommendations?.[roastLevel];
    const adjustment = selected?.adjustments;
    const inheritedRecommendation = parent?.roastRecommendation;
    const roastRecommendation: ResolvedRoastRecommendation | undefined = selected
      ? {
        level: roastLevel,
        flavor: selected.flavor,
        extraction: selected.extraction,
        temperatureExplanation: selected.temperatureExplanation,
        grindExplanation: selected.grindExplanation,
      }
      : inheritedRecommendation && { ...inheritedRecommendation, level: roastLevel };

    if (!roastRecommendation) {
      throw new Error(`Recipe ${id} is missing ${roastLevel} roast recommendations`);
    }

    const localSteps = adjustment?.steps ? [...adjustment.steps] : [...recipe.steps];
    let ingredients = [...(parent?.ingredients ?? []), ...structuredClone(recipe.ingredients)];
    const resolved: ResolvedRecipe = {
      lineage: [...(parent?.lineage ?? []), id],
      ingredients,
      steps: [...(parent?.steps ?? []), ...localSteps],
      roastRecommendation,
    };

    const grind = adjustment?.grind ?? recipe.grind ?? parent?.grind;
    const scalable = recipe.scalable ?? parent?.scalable;
    const brewRatio = recipe.brewRatio ?? parent?.brewRatio;
    const waterTemperatureC = adjustment?.waterTemperatureC
      ?? recipe.waterTemperatureC
      ?? parent?.waterTemperatureC;
    const espressoYieldG = recipe.espressoYieldG ?? parent?.espressoYieldG;
    const waterGuidance = recipe.waterGuidance ?? parent?.waterGuidance;
    if (grind !== undefined) resolved.grind = structuredClone(grind);
    if (scalable !== undefined) resolved.scalable = scalable;
    if (brewRatio !== undefined) resolved.brewRatio = structuredClone(brewRatio);
    if (waterTemperatureC !== undefined) resolved.waterTemperatureC = cloneTemperature(waterTemperatureC);
    if (espressoYieldG !== undefined) resolved.espressoYieldG = espressoYieldG;
    if (waterGuidance !== undefined) resolved.waterGuidance = waterGuidance;

    if (brewRatio?.target.kind === 'ingredient' && waterTemperatureC !== undefined) {
      const targetName = brewRatio.target.ingredientName;
      ingredients = ingredients.map((ingredient) => ingredient.name === targetName
        ? { ...ingredient, temperatureC: cloneTemperature(waterTemperatureC) }
        : ingredient);
      resolved.ingredients = ingredients;
    }

    visiting.delete(id);
    return resolved;
  };

  return visit(drinkId);
}
