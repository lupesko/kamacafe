import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import catalogSchema from '../../specs/004-add-roast-recommendations/contracts/catalog.schema.json';
import registrySchema from '../../specs/001-kamacafe-baseline/contracts/catalog-id-registry.schema.json';
import { resolveRecipe } from './resolve-recipe';
import { assertValidTemperatureGuidance, temperatureGuidanceEquals } from './temperature-guidance';
import { ROAST_LEVELS } from './types';
import type {
  Catalog,
  CatalogIdRegistry,
  GrindGuidance,
  Ingredient,
  QuantityRange,
  TemperatureGuidance,
} from './types';

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

function checkTemperature(
  guidance: TemperatureGuidance | undefined,
  label: string,
  issues: ValidationIssue[],
): void {
  if (guidance === undefined) return;
  try {
    assertValidTemperatureGuidance(guidance);
  } catch (error) {
    issues.push(new ValidationIssue(`${label} has invalid temperature guidance: ${error instanceof Error ? error.message : String(error)}`));
  }
}

function checkGrind(grind: GrindGuidance | undefined, label: string, issues: ValidationIssue[]): void {
  if (grind && grind.referenceMicrons.min > grind.referenceMicrons.max) {
    issues.push(new ValidationIssue(`${label} has an invalid grind micron range`));
  }
}

function temperaturesEqual(first: TemperatureGuidance, second: TemperatureGuidance): boolean {
  try {
    return temperatureGuidanceEquals(first, second);
  } catch {
    return false;
  }
}

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
      checkTemperature(ingredient.temperatureC, `Drink ${drink.id} ingredient ${ingredient.name}`, issues);
    }

    const recipeInput = drink.recipe;
    if (recipeInput.baseRecipeId) {
      if (recipeInput.roastRecommendations) {
        issues.push(new ValidationIssue(`Derived recipe ${drink.id} must inherit roast recommendations`));
      }
    } else if (!recipeInput.roastRecommendations) {
      issues.push(new ValidationIssue(`Root recipe ${drink.id} is missing roast recommendations`));
    }

    if (recipeInput.roastRecommendations) {
      if (recipeInput.roastRecommendations.medium.adjustments) {
        issues.push(new ValidationIssue(`Drink ${drink.id} Medium roast must not define adjustments`));
      }
      for (const roastLevel of ROAST_LEVELS) {
        const recommendation = recipeInput.roastRecommendations[roastLevel];
        const adjustment = recommendation.adjustments;
        if (adjustment) {
          checkTemperature(adjustment.waterTemperatureC, `Drink ${drink.id} ${roastLevel} roast`, issues);
          checkGrind(adjustment.grind, `Drink ${drink.id} ${roastLevel} roast`, issues);
          if (adjustment.steps && (!adjustment.steps.length || adjustment.steps.some((step) => !step.trim()))) {
            issues.push(new ValidationIssue(`Drink ${drink.id} ${roastLevel} roast has invalid variant steps`));
          }
        }
      }
    }
    checkTemperature(recipeInput.waterTemperatureC, `Drink ${drink.id}`, issues);
    checkGrind(recipeInput.grind, `Drink ${drink.id}`, issues);

    const rawTarget = recipeInput.brewRatio?.target;
    if (rawTarget?.kind === 'ingredient' && recipeInput.waterTemperatureC !== undefined) {
      const target = recipeInput.ingredients.find(({ name }) => name === rawTarget.ingredientName);
      if (target?.temperatureC !== undefined
        && !temperaturesEqual(target.temperatureC, recipeInput.waterTemperatureC)) {
        issues.push(new ValidationIssue(`Drink ${drink.id} brew-water ingredient temperature must match its water temperature`));
      }
    }

    for (const roastLevel of ROAST_LEVELS) {
      try {
        const recipe = resolveRecipe(drink.id, catalog.drinks, roastLevel);
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
            } else if (target.temperatureC === undefined
              || recipe.waterTemperatureC === undefined
              || !temperaturesEqual(target.temperatureC, recipe.waterTemperatureC)) {
              issues.push(new ValidationIssue(`Drink ${drink.id} brew-water ingredient temperature must match its water temperature`));
            }
          }
        }
        if (!recipe.grind) issues.push(new ValidationIssue(`Drink ${drink.id} is missing grind guidance`));
        else if (recipe.grind.referenceMicrons.min > recipe.grind.referenceMicrons.max) {
          issues.push(new ValidationIssue(`Drink ${drink.id} has an invalid grind micron range`));
        }
        if (recipe.waterTemperatureC === undefined) issues.push(new ValidationIssue(`Drink ${drink.id} is missing water temperature`));
        else checkTemperature(recipe.waterTemperatureC, `Drink ${drink.id} ${roastLevel} roast`, issues);
        if ([
          recipe.roastRecommendation.flavor,
          recipe.roastRecommendation.extraction,
          recipe.roastRecommendation.temperatureExplanation,
          recipe.roastRecommendation.grindExplanation,
        ].some((value) => !value.trim())) {
          issues.push(new ValidationIssue(`Drink ${drink.id} has incomplete ${roastLevel} roast guidance`));
        }
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
