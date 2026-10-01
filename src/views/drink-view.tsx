import { useState } from 'preact/hooks';
import { BackLink } from '../components/back-link';
import { RecipePanels } from '../components/recipe-panels';
import { formatAmount } from '../catalog/scale-recipe';
import { categoryHash } from '../routing/hash-route';
import type { Category, Drink, ResolvedRecipe } from '../catalog/types';

interface DrinkViewProps {
  category: Category;
  drink: Drink;
  recipe: ResolvedRecipe;
}

export function DrinkView({ category, drink, recipe }: DrinkViewProps) {
  const [multiplier, setMultiplier] = useState(1);
  const caffeine = drink.caffeine.minMg === drink.caffeine.maxMg
    ? `${drink.caffeine.minMg} mg`
    : `${drink.caffeine.minMg}–${drink.caffeine.maxMg} mg`;

  return (
    <main class="page drink-view">
      <BackLink href={categoryHash(category.id)} label={category.name} />
      <article class="drink-hero">
        <div class="drink-hero__copy">
          <p class="eyebrow">Coffee recipe</p>
          <h1>{drink.name}</h1>
          <p class="drink-hero__description">{drink.header}</p>
          <dl class="hero-facts">
            <div><dt>Time</dt><dd>{drink.prepTimeMinutes} min</dd></div>
            <div><dt>Difficulty</dt><dd>{drink.difficulty.level}<small>{drink.difficulty.reason}</small></dd></div>
            {recipe.scalable ? (
              <div>
                <dt>Makes</dt>
                <dd>{formatAmount(multiplier)} {multiplier === 1 ? 'serving' : 'servings'}<small>≈ {formatAmount(drink.servingSizeMl * multiplier)} mL</small></dd>
              </div>
            ) : (
              <div><dt>Serving</dt><dd>{drink.servingSizeMl} mL</dd></div>
            )}
            <div><dt>{recipe.scalable ? 'Caffeine / serving' : 'Caffeine'}</dt><dd>{caffeine}<small>{drink.caffeine.note}</small></dd></div>
          </dl>
        </div>
        <img class="drink-hero__image" src={`/images/${drink.id}.png`} alt="" />
      </article>
      <RecipePanels recipe={recipe} multiplier={multiplier} onMultiplierChange={setMultiplier} />
    </main>
  );
}
