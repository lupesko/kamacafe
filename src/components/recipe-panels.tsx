import type { GrindGuidance, Ingredient, QuantityRange, ResolvedRecipe } from '../catalog/types';
import { formatAmount, getBrewRatioDetails, scaleResolvedRecipe } from '../catalog/scale-recipe';
import { RecipeScaler } from './recipe-scaler';

const isRange = (quantity: Ingredient['quantity']): quantity is QuantityRange => typeof quantity !== 'number';

function quantityText(ingredient: Ingredient): string {
  const amount = isRange(ingredient.quantity)
    ? `${formatAmount(ingredient.quantity.min)}–${formatAmount(ingredient.quantity.max)}`
    : formatAmount(ingredient.quantity);
  const pluralQuantity = isRange(ingredient.quantity) || ingredient.quantity !== 1;
  const unit = ingredient.unit === 'filter' && pluralQuantity ? 'filters' : ingredient.unit;
  return `${amount} ${unit}`;
}

function grindText(grind: GrindGuidance): string {
  const { min, max } = grind.referenceMicrons;
  return `${grind.label} · ~${formatAmount(min)}–${formatAmount(max)} µm`;
}

interface RecipePanelsProps {
  recipe: ResolvedRecipe;
  multiplier: number;
  onMultiplierChange: (multiplier: number) => void;
}

interface RecipeFact {
  label: string;
  value: string;
  layout: 'compact' | 'prose';
}

export function RecipePanels({ recipe, multiplier, onMultiplierChange }: RecipePanelsProps) {
  const ratio = getBrewRatioDetails(recipe);
  const scaledRecipe = scaleResolvedRecipe(recipe, recipe.scalable ? multiplier : 1);
  const brewTarget = scaledRecipe.brewRatio?.target;
  const brewWaterIngredient = brewTarget?.kind === 'ingredient'
    ? scaledRecipe.ingredients.find(({ name }) => name === brewTarget.ingredientName)
    : undefined;
  const waterTemperatureIsInline = brewWaterIngredient?.temperatureC === scaledRecipe.waterTemperatureC;
  const settings: RecipeFact[] = [];
  if (scaledRecipe.grind) {
    settings.push({
      label: 'Grind',
      value: grindText(scaledRecipe.grind),
      layout: 'compact',
    });
  }
  if (scaledRecipe.waterTemperatureC !== undefined && !waterTemperatureIsInline) {
    const label = scaledRecipe.espressoYieldG !== undefined ? 'Espresso brew temperature' : 'Water temperature';
    settings.push({ label, value: `${scaledRecipe.waterTemperatureC}°C`, layout: 'compact' });
  }
  if (scaledRecipe.espressoYieldG !== undefined) {
    settings.push({ label: 'Espresso yield', value: `${formatAmount(scaledRecipe.espressoYieldG)} g`, layout: 'compact' });
  }
  if (scaledRecipe.waterGuidance) {
    settings.push({ label: 'Water guidance', value: scaledRecipe.waterGuidance, layout: 'prose' });
  }

  return (
    <div class="recipe-layout">
      <section class="recipe-panel" aria-labelledby="ingredients-heading">
        <h2 id="ingredients-heading">What you need</h2>
        {recipe.scalable && ratio && (
          <RecipeScaler ratio={ratio} multiplier={multiplier} onMultiplierChange={onMultiplierChange} />
        )}
        <dl class="recipe-facts">
          {scaledRecipe.ingredients.map((ingredient, index) => (
            <div class="recipe-facts__row" key={`${ingredient.name}-${index}`}>
              <dt>{ingredient.name}{ingredient.optional ? ' (optional)' : ''}</dt>
              <dd>
                {quantityText(ingredient)}
                {ingredient.temperatureC !== undefined && <span> · {ingredient.temperatureC}°C</span>}
                {ingredient.note && <small>{ingredient.note}</small>}
              </dd>
            </div>
          ))}
          {settings.map((setting) => (
            <div
              class={`recipe-facts__row${setting.layout === 'prose' ? ' recipe-facts__row--prose' : ''}`}
              key={setting.label}
            >
              <dt>{setting.label}</dt>
              <dd>{setting.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section class="recipe-panel" aria-labelledby="steps-heading">
        <h2 id="steps-heading">How to make it</h2>
        <ol class="recipe-steps" aria-label="Preparation steps">
          {scaledRecipe.steps.map((step, index) => (
            <li key={`${index}-${step}`}><span>{step}</span></li>
          ))}
        </ol>
      </section>
    </div>
  );
}
