import { CategoryCard } from '../components/category-card';
import type { Category } from '../catalog/types';

export function HomeView({ categories }: { categories: Category[] }) {
  return (
    <main class="page home-view">
      <section class="intro">
        <h1>What are we brewing?</h1>
        <p>Choose a style to find your coffee.</p>
      </section>
      <div class="category-grid">
        {categories.map((category, index) => (
          <CategoryCard key={category.id} category={category} tone={index % 2 === 0 ? 'espresso' : 'brewed'} />
        ))}
      </div>
    </main>
  );
}
