import { ROAST_LEVELS } from '../catalog/types';
import type { ResolvedRoastRecommendation, RoastLevel } from '../catalog/types';

interface RoastSelectorProps {
  value: RoastLevel;
  recommendation: ResolvedRoastRecommendation;
  onChange: (level: RoastLevel) => void;
}

const labels: Record<RoastLevel, string> = {
  light: 'Light',
  medium: 'Medium',
  dark: 'Dark',
};

export function RoastSelector({ value, recommendation, onChange }: RoastSelectorProps) {
  return (
    <section class="roast-guidance" aria-label="Roast recommendation">
      <fieldset class="roast-selector">
        <legend>Roast level</legend>
        <div class="roast-selector__options">
          {ROAST_LEVELS.map((level) => (
            <label class="roast-selector__option" key={level}>
              <input
                type="radio"
                name="roast-level"
                value={level}
                checked={value === level}
                onChange={() => onChange(level)}
              />
              <span>{labels[level]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div class="roast-explanation" aria-live="polite">
        <h3 class="roast-explanation__title">{labels[recommendation.level]} roast starting point</h3>
        <dl>
          <div><dt>Flavor</dt><dd>{recommendation.flavor}</dd></div>
          <div><dt>Extraction</dt><dd>{recommendation.extraction}</dd></div>
          <div><dt>Temperature</dt><dd>{recommendation.temperatureExplanation}</dd></div>
          <div><dt>Grind</dt><dd>{recommendation.grindExplanation}</dd></div>
        </dl>
      </div>
    </section>
  );
}
