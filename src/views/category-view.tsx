import { BackLink } from '../components/back-link';
import { DrinkRow } from '../components/drink-row';
import type { Category, Drink } from '../catalog/types';

interface CategoryViewProps {
  category: Category;
  drinks: Drink[];
}

export function CategoryView({ category, drinks }: CategoryViewProps) {
  return (
    <main class="page">
      <BackLink href="#" label="Coffee styles" />
      <header class="page-heading">
        <h1>{category.name}</h1>
      </header>
      <div class="drink-grid">
        {drinks.map((drink) => <DrinkRow key={drink.id} drink={drink} />)}
      </div>
    </main>
  );
}
