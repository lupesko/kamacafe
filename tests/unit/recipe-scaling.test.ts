import { describe, expect, it } from 'vitest';
import { getBrewRatioDetails, scaleResolvedRecipe, scaleTextAmounts } from '../../src/catalog/scale-recipe';
import type { ResolvedRecipe } from '../../src/catalog/types';

const pourOver: ResolvedRecipe = {
  lineage: ['pour-over'],
  ingredients: [
    { name: 'Ground coffee', quantity: 15, unit: 'g' },
    { name: 'Water', quantity: 240, unit: 'mL', temperatureC: 94 },
    { name: 'Paper filter', quantity: 1, unit: 'filter', scaleWithRecipe: false },
  ],
  brewRatio: {
    coffeeIngredientName: 'Ground coffee',
    target: { kind: 'ingredient', ingredientName: 'Water' },
  },
  grind: { label: 'medium-fine', referenceMicrons: { min: 500, max: 800 } },
  waterTemperatureC: 94,
  steps: [
    'Pour 30 mL and wait 30 seconds.',
    'Pour the remaining 210 mL and drain in 3–4 minutes.',
  ],
};

describe('recipe scaling', () => {
  it('describes a water-based brew ratio from explicit catalog references', () => {
    expect(getBrewRatioDetails(pourOver)).toEqual({
      ratioText: '1:16',
      relationshipLabel: 'Coffee : water',
    });
  });

  it('scales ingredients and instruction amounts without scaling settings or equipment', () => {
    const scaled = scaleResolvedRecipe(pourOver, 2);

    expect(scaled.ingredients.map(({ quantity }) => quantity)).toEqual([30, 480, 1]);
    expect(scaled.waterTemperatureC).toBe(94);
    expect(scaled.grind).toEqual(pourOver.grind);
    expect(scaled.grind).not.toBe(pourOver.grind);
    expect(scaled.steps).toEqual([
      'Pour 60 mL and wait 30 seconds.',
      'Pour the remaining 420 mL and drain in 3–4 minutes.',
    ]);
    expect(pourOver.ingredients.map(({ quantity }) => quantity)).toEqual([15, 240, 1]);
  });

  it('scales ranges and espresso yield while leaving temperatures and times unchanged', () => {
    expect(scaleTextAmounts('Use 5–10 mL at 60°C for 30 seconds.', 2)).toBe(
      'Use 10–20 mL at 60°C for 30 seconds.',
    );

    const espresso: ResolvedRecipe = {
      lineage: ['espresso'],
      ingredients: [{ name: 'Ground coffee', quantity: 18, unit: 'g' }],
      brewRatio: { coffeeIngredientName: 'Ground coffee', target: { kind: 'espresso-yield' } },
      grind: { label: 'fine', referenceMicrons: { min: 200, max: 500 } },
      waterTemperatureC: 93,
      espressoYieldG: 36,
      waterGuidance: 'Target 36 g of brewed espresso.',
      steps: ['Pull 36 g in 25–30 seconds.'],
    };
    const scaled = scaleResolvedRecipe(espresso, 2);

    expect(getBrewRatioDetails(espresso)?.ratioText).toBe('1:2');
    expect(scaled.espressoYieldG).toBe(72);
    expect(scaled.waterGuidance).toContain('72 g');
    expect(scaled.steps[0]).toBe('Pull 72 g in 25–30 seconds.');
  });
});
