import { ArrowIcon } from './arrow-icon';
import { categoryHash } from '../routing/hash-route';
import type { Category } from '../catalog/types';

interface CategoryCardProps {
  category: Category;
  tone: 'espresso' | 'brewed';
}

export function CategoryCard({ category, tone }: CategoryCardProps) {
  const imageSrc = tone === 'espresso' ? '/images/espresso.png' : '/images/pour-over.png';

  return (
    <a class={`category-card category-card--${tone}`} href={categoryHash(category.id)}>
      <span class="category-card__icon" aria-hidden="true">
        <img src={imageSrc} alt="" />
      </span>
      <span class="category-card__copy">
        <strong>{category.name}</strong>
        <span>{category.description}</span>
      </span>
      <span class="round-arrow" aria-hidden="true">
        <ArrowIcon />
      </span>
    </a>
  );
}
