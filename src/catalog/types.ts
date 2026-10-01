export type DifficultyLevel = 'Easy' | 'Moderate' | 'Advanced';

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Difficulty {
  level: DifficultyLevel;
  reason: string;
}

export interface CaffeineEstimate {
  minMg: number;
  maxMg: number;
  note: string;
  sourceUrls: string[];
}

export interface QuantityRange {
  min: number;
  max: number;
}

export interface GrindGuidance {
  label: string;
  referenceMicrons: QuantityRange;
}

export type IngredientUnit = 'g' | 'mL' | 'filter';

export interface Ingredient {
  name: string;
  quantity: number | QuantityRange;
  unit: IngredientUnit;
  temperatureC?: number;
  optional?: boolean;
  note?: string;
  scaleWithRecipe?: boolean;
}

export type BrewRatioTarget =
  | { kind: 'ingredient'; ingredientName: string }
  | { kind: 'espresso-yield' };

export interface BrewRatio {
  coffeeIngredientName: string;
  target: BrewRatioTarget;
}

export interface Recipe {
  baseRecipeId?: string;
  ingredients: Ingredient[];
  scalable?: boolean;
  brewRatio?: BrewRatio;
  grind?: GrindGuidance;
  waterTemperatureC?: number;
  espressoYieldG?: number;
  waterGuidance?: string;
  steps: string[];
}

export interface Drink {
  id: string;
  name: string;
  header: string;
  category: string;
  servingSizeMl: number;
  prepTimeMinutes: number;
  difficulty: Difficulty;
  caffeine: CaffeineEstimate;
  recipe: Recipe;
}

export interface Catalog {
  categories: Category[];
  drinks: Drink[];
}

export interface CatalogIdRecord {
  id: string;
  kind: 'category' | 'drink';
  introducedAs: string;
  status: 'active' | 'retired';
}

export interface CatalogIdRegistry {
  records: CatalogIdRecord[];
}

export interface ResolvedRecipe {
  lineage: string[];
  ingredients: Ingredient[];
  steps: string[];
  scalable?: boolean;
  brewRatio?: BrewRatio;
  grind?: GrindGuidance;
  waterTemperatureC?: number;
  espressoYieldG?: number;
  waterGuidance?: string;
}

export type AppRoute =
  | { kind: 'home' }
  | { kind: 'category'; id: string }
  | { kind: 'drink'; id: string }
  | { kind: 'unavailable'; hash: string };
