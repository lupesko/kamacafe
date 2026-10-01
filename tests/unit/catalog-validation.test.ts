import { describe, expect, it } from 'vitest';
import catalogJson from '../../catalog.json';
import { validateCatalog } from '../../src/catalog/validate';
import type { Catalog, CatalogIdRegistry } from '../../src/catalog/types';

const catalog = catalogJson as Catalog;
const registry: CatalogIdRegistry = {
  records: [
    ...catalog.categories.map(({ id, name }) => ({ id, kind: 'category' as const, introducedAs: name, status: 'active' as const })),
    ...catalog.drinks.map(({ id, name }) => ({ id, kind: 'drink' as const, introducedAs: name, status: 'active' as const })),
  ],
};
const imageIds = new Set(catalog.drinks.map(({ id }) => id));

const clone = (): Catalog => structuredClone(catalog);
const errorsFor = (candidate: unknown, candidateRegistry: unknown = registry) =>
  validateCatalog(candidate, candidateRegistry, { imageIds }).map(({ message }) => message);

describe('catalog validation', () => {
  it('accepts the approved seed catalog', () => {
    expect(errorsFor(catalog)).toEqual([]);
  });

  it('uses one 240 mL cup of water per brewed-coffee serving', () => {
    for (const id of ['pour-over', 'french-press']) {
      const drink = catalog.drinks.find((candidate) => candidate.id === id)!;
      const water = drink.recipe.ingredients.find(({ name }) => name === 'Water')!;

      expect(drink.servingSizeMl).toBe(240);
      expect(water.quantity).toBe(240);
    }
  });

  it.each([
    ['blank category name', (value: Catalog) => { value.categories[0].name = ' '; }],
    ['invalid category ID', (value: Catalog) => { value.categories[0].id = 'Bad_ID'; }],
    ['non-positive serving size', (value: Catalog) => { value.drinks[0].servingSizeMl = 0; }],
    ['invalid difficulty', (value: Catalog) => { value.drinks[0].difficulty.level = 'Expert' as never; }],
    ['insecure caffeine source', (value: Catalog) => { value.drinks[0].caffeine.sourceUrls = ['http://example.com']; }],
    ['backward caffeine range', (value: Catalog) => { value.drinks[0].caffeine.minMg = value.drinks[0].caffeine.maxMg + 1; }],
    ['invalid ingredient unit', (value: Catalog) => { value.drinks[0].recipe.ingredients[0].unit = 'oz' as never; }],
    ['backward quantity range', (value: Catalog) => { value.drinks[5].recipe.ingredients[0].quantity = { min: 5, max: 2 }; }],
    ['non-positive grind range', (value: Catalog) => { value.drinks[0].recipe.grind!.referenceMicrons.min = 0; }],
    ['backward grind range', (value: Catalog) => { value.drinks[0].recipe.grind!.referenceMicrons = { min: 500, max: 200 }; }],
  ])('rejects %s', (_name, mutate) => {
    const candidate = clone();
    mutate(candidate);
    expect(errorsFor(candidate).length).toBeGreaterThan(0);
  });

  it('rejects duplicates and unresolved category references', () => {
    const duplicate = clone();
    duplicate.drinks[1].id = duplicate.drinks[0].id;
    expect(errorsFor(duplicate).join(' ')).toMatch(/duplicate/i);

    const missingCategory = clone();
    missingCategory.drinks[0].category = 'missing';
    expect(errorsFor(missingCategory).join(' ')).toMatch(/category/i);
  });

  it('rejects incomplete resolved guidance and invalid milk guidance', () => {
    const noGrind = clone();
    delete noGrind.drinks[0].recipe.grind;
    expect(errorsFor(noGrind).join(' ')).toMatch(/grind/i);

    const noMilkTemperature = clone();
    delete noMilkTemperature.drinks.find(({ id }) => id === 'latte')?.recipe.ingredients[0].temperatureC;
    expect(errorsFor(noMilkTemperature).join(' ')).toMatch(/milk.*temperature/i);

    const noRatio = clone();
    delete noRatio.drinks.find(({ id }) => id === 'pour-over')?.recipe.brewRatio;
    expect(errorsFor(noRatio).join(' ')).toMatch(/ratio/i);

    const invalidRatioTarget = clone();
    const pourOver = invalidRatioTarget.drinks.find(({ id }) => id === 'pour-over')!;
    pourOver.recipe.brewRatio!.target = { kind: 'ingredient', ingredientName: 'Paper filter' };
    expect(errorsFor(invalidRatioTarget).join(' ')).toMatch(/ratio.*water/i);

    const mismatchedWaterTemperature = clone();
    const water = mismatchedWaterTemperature.drinks
      .find(({ id }) => id === 'pour-over')!
      .recipe.ingredients.find(({ name }) => name === 'Water')!;
    water.temperatureC = 90;
    expect(errorsFor(mismatchedWaterTemperature).join(' ')).toMatch(/brew-water.*temperature.*match/i);
  });

  it('requires exactly one matching image and rejects orphan images', () => {
    expect(validateCatalog(catalog, registry, { imageIds: new Set([...imageIds].filter((id) => id !== 'espresso')) }).join(' ')).toMatch(/image/i);
    expect(validateCatalog(catalog, registry, { imageIds: new Set([...imageIds, 'retired-drink']) }).join(' ')).toMatch(/orphan/i);
  });

  it('enforces active current IDs and permanent retirement', () => {
    const missing = structuredClone(registry);
    missing.records = missing.records.filter(({ id }) => id !== 'espresso');
    expect(errorsFor(catalog, missing).join(' ')).toMatch(/registry/i);

    const retired = structuredClone(registry);
    retired.records.find(({ id }) => id === 'espresso')!.status = 'retired';
    expect(errorsFor(catalog, retired).join(' ')).toMatch(/retired/i);
  });
});
