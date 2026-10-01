import { describe, expect, it } from 'vitest';
import { resolveRecipe } from '../../src/catalog/resolve-recipe';
import type { Drink } from '../../src/catalog/types';

const baseDrink: Drink = {
  id: 'espresso',
  name: 'Espresso',
  header: 'A shot.',
  category: 'espresso-drink',
  servingSizeMl: 36,
  prepTimeMinutes: 5,
  difficulty: { level: 'Moderate', reason: 'Practice.' },
  caffeine: { minMg: 70, maxMg: 145, note: 'Varies.', sourceUrls: ['https://example.com'] },
  recipe: {
    ingredients: [{ name: 'Ground coffee', quantity: 18, unit: 'g' }],
    brewRatio: { coffeeIngredientName: 'Ground coffee', target: { kind: 'espresso-yield' } },
    grind: { label: 'fine', referenceMicrons: { min: 200, max: 500 } },
    waterTemperatureC: 93,
    espressoYieldG: 36,
    waterGuidance: 'Use the reservoir.',
    steps: ['Pull the shot.'],
  },
};

const latte: Drink = {
  ...baseDrink,
  id: 'latte',
  name: 'Latte',
  servingSizeMl: 216,
  recipe: {
    baseRecipeId: 'espresso',
    ingredients: [{ name: 'Milk', quantity: 180, unit: 'mL', temperatureC: 60 }],
    steps: ['Steam the milk.', 'Pour the milk.'],
  },
};

describe('resolveRecipe', () => {
  it('returns ancestor-first arrays and nearest scalar settings without mutation', () => {
    const drinks = [baseDrink, latte] as const;
    const before = structuredClone(drinks);
    const resolved = resolveRecipe('latte', drinks);

    expect(resolved.lineage).toEqual(['espresso', 'latte']);
    expect(resolved.ingredients.map((ingredient) => ingredient.name)).toEqual(['Ground coffee', 'Milk']);
    expect(resolved.steps).toEqual(['Pull the shot.', 'Steam the milk.', 'Pour the milk.']);
    expect(resolved.brewRatio).toEqual(baseDrink.recipe.brewRatio);
    expect(resolved.grind).toEqual(baseDrink.recipe.grind);
    expect(resolved.grind).not.toBe(baseDrink.recipe.grind);
    expect(resolved.waterTemperatureC).toBe(93);
    expect(resolved.espressoYieldG).toBe(36);
    expect(drinks).toEqual(before);
  });

  it('uses the nearest local scalar value', () => {
    const grind = { label: 'medium-fine', referenceMicrons: { min: 500, max: 800 } };
    const local = { ...latte, recipe: { ...latte.recipe, grind } };
    expect(resolveRecipe('latte', [baseDrink, local]).grind).toEqual(grind);
  });

  it('inherits scalability while allowing a local recipe to opt out', () => {
    const scalableBase = { ...baseDrink, recipe: { ...baseDrink.recipe, scalable: true } };
    expect(resolveRecipe('latte', [scalableBase, latte]).scalable).toBe(true);

    const fixedLatte = { ...latte, recipe: { ...latte.recipe, scalable: false } };
    expect(resolveRecipe('latte', [scalableBase, fixedLatte]).scalable).toBe(false);
  });

  it('rejects an unknown selected or base recipe ID', () => {
    expect(() => resolveRecipe('missing', [baseDrink])).toThrow(/unknown drink/i);
    const broken = { ...latte, recipe: { ...latte.recipe, baseRecipeId: 'missing' } };
    expect(() => resolveRecipe('latte', [baseDrink, broken])).toThrow(/unknown base recipe/i);
  });

  it('rejects self references and longer cycles', () => {
    const self = { ...baseDrink, recipe: { ...baseDrink.recipe, baseRecipeId: 'espresso' } };
    expect(() => resolveRecipe('espresso', [self])).toThrow(/cycle/i);

    const first = { ...baseDrink, recipe: { ...baseDrink.recipe, baseRecipeId: 'latte' } };
    const second = { ...latte, recipe: { ...latte.recipe, baseRecipeId: 'espresso' } };
    expect(() => resolveRecipe('latte', [first, second])).toThrow(/cycle/i);
  });
});
