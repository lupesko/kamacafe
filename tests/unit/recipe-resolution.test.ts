import { describe, expect, it } from 'vitest';
import catalogJson from '../../catalog.json';
import { resolveRecipe } from '../../src/catalog/resolve-recipe';
import type { Catalog, Drink, RoastRecommendations } from '../../src/catalog/types';

const recommendation = (label: string) => ({
  flavor: `${label} flavor.`,
  extraction: `${label} extraction.`,
  temperatureExplanation: `${label} temperature.`,
  grindExplanation: `${label} grind.`,
});

const roastRecommendations: RoastRecommendations = {
  light: recommendation('Light'),
  medium: recommendation('Medium'),
  dark: recommendation('Dark'),
};

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
    roastRecommendations,
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
  it('defaults to the Medium baseline and resolves explicit Light and Dark variants immutably', () => {
    const catalog = catalogJson as Catalog;
    const before = structuredClone(catalog.drinks);
    const medium = resolveRecipe('pour-over', catalog.drinks);
    const light = resolveRecipe('pour-over', catalog.drinks, 'light');
    const dark = resolveRecipe('pour-over', catalog.drinks, 'dark');

    expect(medium.roastRecommendation?.level).toBe('medium');
    expect(medium.waterTemperatureC).toBe(94);
    expect(medium.grind).toMatchObject({ label: 'medium-fine', referenceMicrons: { min: 500, max: 800 } });
    expect(light.roastRecommendation?.level).toBe('light');
    expect(light.waterTemperatureC).toBe(96);
    expect(light.grind).toMatchObject({ label: 'fine-to-medium-fine', referenceMicrons: { min: 400, max: 700 } });
    expect(light.steps.join(' ')).toContain('96°C');
    expect(dark.roastRecommendation?.level).toBe('dark');
    expect(dark.waterTemperatureC).toBe(90);
    expect(dark.grind).toMatchObject({ label: 'medium', referenceMicrons: { min: 700, max: 1000 } });
    expect(dark.steps.join(' ')).toContain('90°C');

    const lightWater = light.ingredients.find(({ name }) => name === 'Water');
    const darkWater = dark.ingredients.find(({ name }) => name === 'Water');
    expect(lightWater?.temperatureC).toBe(96);
    expect(darkWater?.temperatureC).toBe(90);
    expect(lightWater?.quantity).toBe(240);
    expect(darkWater?.quantity).toBe(240);
    expect(catalog.drinks).toEqual(before);
  });

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

  it('inherits selected Espresso settings and steps while preserving Latte and Americano content', () => {
    const catalog = catalogJson as Catalog;
    const latteLight = resolveRecipe('latte', catalog.drinks, 'light');
    const latteDark = resolveRecipe('latte', catalog.drinks, 'dark');
    const americanoDark = resolveRecipe('americano', catalog.drinks, 'dark');

    expect(latteLight.waterTemperatureC).toBe(94);
    expect(latteLight.grind?.referenceMicrons).toEqual({ min: 150, max: 400 });
    expect(latteLight.steps.slice(0, 3).join(' ')).toContain('94°C');
    expect(latteDark.waterTemperatureC).toEqual({ min: 90, max: 91 });
    expect(latteDark.grind?.referenceMicrons).toEqual({ min: 300, max: 600 });
    expect(latteDark.ingredients.find(({ name }) => name === 'Milk')?.temperatureC).toBe(60);
    expect(latteDark.steps.slice(-3)).toEqual(
      catalog.drinks.find(({ id }) => id === 'latte')!.recipe.steps,
    );
    expect(americanoDark.ingredients.find(({ name }) => name === 'Dilution water')?.temperatureC).toBe(85);
    expect(americanoDark.steps).toContain('Add 150 mL of dilution water at about 85°C to a mug.');
  });

  it('carries the root recommendation through nested derived lineage', () => {
    const catalog = structuredClone(catalogJson) as Catalog;
    const nested: Drink = {
      ...catalog.drinks.find(({ id }) => id === 'latte')!,
      id: 'nested-latte',
      name: 'Nested latte',
      recipe: {
        baseRecipeId: 'latte',
        ingredients: [{ name: 'Cinnamon', quantity: 1, unit: 'g' }],
        steps: ['Dust with 1 g of cinnamon.'],
      },
    };
    catalog.drinks.push(nested);

    const resolved = resolveRecipe('nested-latte', catalog.drinks, 'dark');
    expect(resolved.lineage).toEqual(['espresso', 'latte', 'nested-latte']);
    expect(resolved.roastRecommendation?.level).toBe('dark');
    expect(resolved.waterTemperatureC).toEqual({ min: 90, max: 91 });
    expect(resolved.steps.at(-1)).toBe('Dust with 1 g of cinnamon.');
  });

  it('keeps Turkish settings fixed while varying controlled-heating steps', () => {
    const catalog = catalogJson as Catalog;
    const variants = (['light', 'medium', 'dark'] as const)
      .map((level) => resolveRecipe('turkish', catalog.drinks, level));

    for (const variant of variants) {
      expect(variant.waterTemperatureC).toBe(20);
      expect(variant.grind).toMatchObject({ label: 'extra-fine', referenceMicrons: { min: 50, max: 200 } });
    }
    expect(variants[0].steps).not.toEqual(variants[1].steps);
    expect(variants[2].steps).not.toEqual(variants[1].steps);
  });
});
