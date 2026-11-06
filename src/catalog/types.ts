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

export type RoastLevel = 'light' | 'medium' | 'dark';

export const ROAST_LEVELS = ['light', 'medium', 'dark'] as const satisfies readonly RoastLevel[];

export interface TemperatureRange {
  min: number;
  max: number;
}

export type TemperatureGuidance = number | TemperatureRange;

export interface GrindGuidance {
  label: string;
  referenceMicrons: QuantityRange;
}

export type IngredientUnit = 'g' | 'mL' | 'filter';

export interface Ingredient {
  name: string;
  quantity: number | QuantityRange;
  unit: IngredientUnit;
  temperatureC?: TemperatureGuidance;
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

export type NonEmptyArray<T> = readonly [T, ...T[]];

export type RoastAdjustment =
  | {
    grind: GrindGuidance;
    waterTemperatureC?: TemperatureGuidance;
    steps?: NonEmptyArray<string>;
  }
  | {
    grind?: GrindGuidance;
    waterTemperatureC: TemperatureGuidance;
    steps?: NonEmptyArray<string>;
  }
  | {
    grind?: GrindGuidance;
    waterTemperatureC?: TemperatureGuidance;
    steps: NonEmptyArray<string>;
  };

export interface RoastRecommendation {
  flavor: string;
  extraction: string;
  temperatureExplanation: string;
  grindExplanation: string;
  adjustments?: RoastAdjustment;
}

export type RoastRecommendations = Record<RoastLevel, RoastRecommendation>;

export interface ResolvedRoastRecommendation {
  level: RoastLevel;
  flavor: string;
  extraction: string;
  temperatureExplanation: string;
  grindExplanation: string;
}

export interface Recipe {
  baseRecipeId?: string;
  ingredients: Ingredient[];
  scalable?: boolean;
  brewRatio?: BrewRatio;
  grind?: GrindGuidance;
  waterTemperatureC?: TemperatureGuidance;
  espressoYieldG?: number;
  waterGuidance?: string;
  steps: string[];
  roastRecommendations?: RoastRecommendations;
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
  waterTemperatureC?: TemperatureGuidance;
  espressoYieldG?: number;
  waterGuidance?: string;
  roastRecommendation: ResolvedRoastRecommendation;
}

export type AppRoute =
  | { kind: 'home' }
  | { kind: 'category'; id: string }
  | { kind: 'drink'; id: string }
  | { kind: 'unavailable'; hash: string };
