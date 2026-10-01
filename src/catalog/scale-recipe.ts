import type { Ingredient, IngredientUnit, QuantityRange, ResolvedRecipe } from './types';

const isRange = (quantity: Ingredient['quantity']): quantity is QuantityRange => typeof quantity !== 'number';

export interface BrewRatioDetails {
  ratioText: string;
  relationshipLabel: string;
}

function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(roundAmount(value));
}

function scaleQuantity(quantity: Ingredient['quantity'], multiplier: number): Ingredient['quantity'] {
  if (isRange(quantity)) {
    return {
      min: roundAmount(quantity.min * multiplier),
      max: roundAmount(quantity.max * multiplier),
    };
  }
  return roundAmount(quantity * multiplier);
}

export function scaleTextAmounts(text: string, multiplier: number): string {
  if (multiplier === 1) return text;

  return text.replace(
    /(\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?\s+(g|mL)\b/g,
    (_match, first: string, second: string | undefined, unit: IngredientUnit) => {
      const scaledFirst = formatAmount(Number(first) * multiplier);
      const scaledAmount = second
        ? `${scaledFirst}–${formatAmount(Number(second) * multiplier)}`
        : scaledFirst;
      return `${scaledAmount} ${unit}`;
    },
  );
}

export function getBrewRatioDetails(recipe: ResolvedRecipe): BrewRatioDetails | undefined {
  if (!recipe.brewRatio) return undefined;

  const coffee = recipe.ingredients.find(({ name }) => name === recipe.brewRatio?.coffeeIngredientName);
  if (!coffee || typeof coffee.quantity !== 'number') return undefined;

  let targetAmount: number | undefined;
  let targetLabel: string;

  if (recipe.brewRatio.target.kind === 'espresso-yield') {
    targetAmount = recipe.espressoYieldG;
    targetLabel = 'Espresso yield';
  } else {
    const targetName = recipe.brewRatio.target.ingredientName;
    const target = recipe.ingredients.find(({ name }) => name === targetName);
    if (target && typeof target.quantity === 'number') targetAmount = target.quantity;
    targetLabel = recipe.brewRatio.target.ingredientName;
  }

  if (targetAmount === undefined) return undefined;
  const targetPerGram = targetAmount / coffee.quantity;

  return {
    ratioText: `1:${formatAmount(targetPerGram)}`,
    relationshipLabel: recipe.brewRatio.target.kind === 'espresso-yield'
      ? 'Coffee : espresso yield'
      : `Coffee : ${targetLabel.toLowerCase()}`,
  };
}

export function scaleResolvedRecipe(recipe: ResolvedRecipe, multiplier: number): ResolvedRecipe {
  const safeMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  const scaled: ResolvedRecipe = {
    ...recipe,
    lineage: [...recipe.lineage],
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      quantity: ingredient.scaleWithRecipe === false
        ? structuredClone(ingredient.quantity)
        : scaleQuantity(ingredient.quantity, safeMultiplier),
    })),
    steps: recipe.steps.map((step) => scaleTextAmounts(step, safeMultiplier)),
  };

  if (recipe.grind) scaled.grind = structuredClone(recipe.grind);
  if (recipe.brewRatio) scaled.brewRatio = structuredClone(recipe.brewRatio);
  if (recipe.espressoYieldG !== undefined) {
    scaled.espressoYieldG = roundAmount(recipe.espressoYieldG * safeMultiplier);
  }
  if (recipe.waterGuidance) {
    scaled.waterGuidance = scaleTextAmounts(recipe.waterGuidance, safeMultiplier);
  }

  return scaled;
}
