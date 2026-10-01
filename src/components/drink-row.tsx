import { ArrowIcon } from './arrow-icon';
import { drinkHash } from '../routing/hash-route';
import type { Drink } from '../catalog/types';

export function DrinkRow({ drink }: { drink: Drink }) {
  return (
    <a class="drink-row" href={drinkHash(drink.id)}>
      <span class="drink-row__image-well" aria-hidden="true">
        <img src={`/images/${drink.id}.png`} alt="" loading="lazy" />
      </span>
      <span class="drink-row__copy">
        <strong class="drink-row__name">{drink.name}</strong>
        <span>{drink.prepTimeMinutes} min · {drink.difficulty.level}</span>
      </span>
      <span class="round-arrow" aria-hidden="true">
        <ArrowIcon />
      </span>
    </a>
  );
}
