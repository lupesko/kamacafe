import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import catalogSchema from '../../specs/001-kamacafe-baseline/contracts/catalog.schema.json';
import registrySchema from '../../specs/001-kamacafe-baseline/contracts/catalog-id-registry.schema.json';
import { resolveRecipe } from './resolve-recipe';
import type { Catalog, CatalogIdRegistry, Ingredient, QuantityRange } from './types';

export class ValidationIssue {
  constructor(
    public readonly message: string,
    public readonly path = '',
  ) {}

  toString(): string {
    return this.path ? `${this.path}: ${this.message}` : this.message;
  }
}

export interface ValidationOptions {
  imageIds?: ReadonlySet<string>;
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateCatalogSchema = ajv.compile(catalogSchema);
const validateRegistrySchema = ajv.compile(registrySchema);

function schemaIssues(errors: ErrorObject[] | null | undefined, label: string): ValidationIssue[] {
  return (errors ?? []).map((error) => new ValidationIssue(error.message ?? 'is invalid', `${label}${error.instancePath}`));
}

function duplicateIssues(values: readonly string[], label: string): ValidationIssue[] {
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const value of values) {
    if (seen.has(value)) issues.push(new ValidationIssue(`Duplicate ${label} ID: ${value}`));
    seen.add(value);
  }
  return issues;
}

const isRange = (quantity: Ingredient['quantity']): quantity is QuantityRange => typeof quantity !== 'number';

export function validateCatalog(
  catalogInput: unknown,
  registryInput: unknown,
  options: ValidationOptions = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!validateCatalogSchema(catalogInput)) issues.push(...schemaIssues(validateCatalogSchema.errors, 'catalog'));
  if (!validateRegistrySchema(registryInput)) issues.push(...schemaIssues(validateRegistrySchema.errors, 'registry'));
  if (issues.length) return issues;

  const catalog = catalogInput as Catalog;
  const registry = registryInput as CatalogIdRegistry;
  issues.push(...duplicateIssues(catalog.categories.map(({ id }) => id), 'category'));
  issues.push(...duplicateIssues(catalog.drinks.map(({ id }) => id), 'drink'));
  issues.push(...duplicateIssues(registry.records.map(({ kind, id }) => `${kind}:${id}`), 'registry'));

  const categoryIds = new Set(catalog.categories.map(({ id }) => id));
  const drinkIds = new Set(catalog.drinks.map(({ id }) => id));
  const records = new Map(registry.records.map((record) => [`${record.kind}:${record.id}`, record]));

  for (const category of catalog.categories) {
    const record = records.get(`category:${category.id}`);
    if (!record) issues.push(new ValidationIssue(`Category ${category.id} is missing from the registry`));
    else if (record.status !== 'active') issues.push(new ValidationIssue(`Category ${category.id} is retired`));
  }

  for (const drink of catalog.drinks) {
    if (!categoryIds.has(drink.category)) issues.push(new ValidationIssue(`Drink ${drink.id} references unknown category ${drink.category}`));
    const record = records.get(`drink:${drink.id}`);
    if (!record) issues.push(new ValidationIssue(`Drink ${drink.id} is missing from the registry`));
    else if (record.status !== 'active') issues.push(new ValidationIssue(`Drink ${drink.id} uses a retired ID`));
    if (drink.caffeine.minMg > drink.caffeine.maxMg) issues.push(new ValidationIssue(`Drink ${drink.id} has an invalid caffeine range`));
    for (const ingredient of drink.recipe.ingredients) {
      if (isRange(ingredient.quantity) && ingredient.quantity.min > ingredient.quantity.max) {
        issues.push(new ValidationIssue(`Drink ${drink.id} ingredient ${ingredient.name} has an invalid quantity range`));
      }
    }

    try {
      const recipe = resolveRecipe(drink.id, catalog.drinks);
      const hasCoffee = recipe.ingredients.some(({ name }) => name.toLowerCase().includes('coffee'));
      const hasWaterAmount = recipe.ingredients.some(({ name }) => name.toLowerCase() === 'water');
      const hasYieldGuidance = recipe.espressoYieldG !== undefined && Boolean(recipe.waterGuidance);
      if (!hasCoffee) issues.push(new ValidationIssue(`Drink ${drink.id} is missing a coffee amount`));
      if (recipe.scalable && !recipe.brewRatio) {
        issues.push(new ValidationIssue(`Drink ${drink.id} is missing brew ratio guidance`));
      }
      if (recipe.brewRatio) {
        const coffeeMatches = recipe.ingredients.filter(({ name }) => name === recipe.brewRatio?.coffeeIngredientName);
        const coffee = coffeeMatches[0];
        if (coffeeMatches.length !== 1 || !coffee || typeof coffee.quantity !== 'number' || coffee.unit !== 'g') {
          issues.push(new ValidationIssue(`Drink ${drink.id} brew ratio must reference one exact coffee ingredient measured in g`));
        }

        if (recipe.brewRatio.target.kind === 'espresso-yield') {
          if (recipe.espressoYieldG === undefined) {
            issues.push(new ValidationIssue(`Drink ${drink.id} brew ratio references a missing espresso yield`));
          }
        } else {
          const targetName = recipe.brewRatio.target.ingredientName;
          const targetMatches = recipe.ingredients.filter(({ name }) => name === targetName);
          const target = targetMatches[0];
          if (targetMatches.length !== 1 || !target || typeof target.quantity !== 'number' || target.unit !== 'mL') {
            issues.push(new ValidationIssue(`Drink ${drink.id} brew ratio must reference one exact water ingredient measured in mL`));
          } else if (target.temperatureC !== recipe.waterTemperatureC) {
            issues.push(new ValidationIssue(`Drink ${drink.id} brew-water ingredient temperature must match its water temperature`));
          }
        }
      }
      if (!recipe.grind) issues.push(new ValidationIssue(`Drink ${drink.id} is missing grind guidance`));
      else if (recipe.grind.referenceMicrons.min > recipe.grind.referenceMicrons.max) {
        issues.push(new ValidationIssue(`Drink ${drink.id} has an invalid grind micron range`));
      }
      if (recipe.waterTemperatureC === undefined) issues.push(new ValidationIssue(`Drink ${drink.id} is missing water temperature`));
      if (!hasWaterAmount && !hasYieldGuidance) issues.push(new ValidationIssue(`Drink ${drink.id} is missing water amount or espresso yield guidance`));
      if (!recipe.steps.length || recipe.steps.some((step) => !step.trim())) issues.push(new ValidationIssue(`Drink ${drink.id} has invalid preparation steps`));
      for (const ingredient of recipe.ingredients) {
        if (ingredient.name.toLowerCase().includes('milk') && ingredient.temperatureC === undefined) {
          issues.push(new ValidationIssue(`Drink ${drink.id} milk ingredient is missing temperature`));
        }
      }
    } catch (error) {
      issues.push(new ValidationIssue(error instanceof Error ? error.message : String(error)));
    }
  }

  for (const record of registry.records) {
    const current = record.kind === 'category' ? categoryIds.has(record.id) : drinkIds.has(record.id);
    if (record.status === 'retired' && current) issues.push(new ValidationIssue(`Retired ${record.kind} ID ${record.id} is present in the catalog`));
  }

  if (options.imageIds) {
    for (const id of drinkIds) {
      if (!options.imageIds.has(id)) issues.push(new ValidationIssue(`Drink ${id} is missing its image`));
    }
    for (const id of options.imageIds) {
      if (!drinkIds.has(id)) issues.push(new ValidationIssue(`Orphan drink image: ${id}`));
    }
  }

  return issues;
}
