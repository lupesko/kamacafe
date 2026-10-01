import type { BrewRatioDetails } from '../catalog/scale-recipe';
import { formatAmount } from '../catalog/scale-recipe';

interface RecipeScalerProps {
  multiplier: number;
  ratio: BrewRatioDetails;
  onMultiplierChange: (multiplier: number) => void;
}

const MAX_MULTIPLIER = 20;

export function RecipeScaler({ multiplier, ratio, onMultiplierChange }: RecipeScalerProps) {
  const servingsText = multiplier === 1 ? '1' : formatAmount(multiplier);

  return (
    <section class="recipe-scaler" aria-label="Scale recipe">
      <div class="recipe-scaler__ratio">
        <span>Brew ratio</span>
        <strong>{ratio.ratioText}</strong>
        <small>{ratio.relationshipLabel}</small>
      </div>

      <div class="recipe-scaler__servings">
        <span id="servings-label">Servings</span>
        <div class="serving-stepper" aria-labelledby="servings-label">
          <button
            type="button"
            aria-label="Decrease servings"
            disabled={multiplier <= 1}
            onClick={() => onMultiplierChange(Math.max(1, multiplier - 1))}
          >
            <svg class="serving-stepper__icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M5 10h10" />
            </svg>
          </button>
          <output aria-live="polite" aria-atomic="true">{servingsText}</output>
          <button
            type="button"
            aria-label="Increase servings"
            disabled={multiplier >= MAX_MULTIPLIER}
            onClick={() => onMultiplierChange(Math.min(MAX_MULTIPLIER, multiplier + 1))}
          >
            <svg class="serving-stepper__icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M5 10h10M10 5v10" />
            </svg>
          </button>
        </div>
      </div>

      <p id="scaling-guidance" class="recipe-scaler__guidance">
        Proportions scale together. Check your brewer capacity and adjust timing for larger batches.
      </p>
    </section>
  );
}
