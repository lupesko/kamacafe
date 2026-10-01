import { useEffect } from 'preact/hooks';
import { AppHeader } from './components/app-header';
import { SiteFooter } from './components/site-footer';
import { catalog, categoriesById, drinksById, drinksForCategory, resolvedRecipesByDrinkId } from './catalog/load';
import { useHashRoute } from './routing/use-hash-route';
import { HomeView } from './views/home-view';
import { CategoryView } from './views/category-view';
import { DrinkView } from './views/drink-view';
import { UnavailableView } from './views/unavailable-view';

export function App() {
  const route = useHashRoute();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  let view;
  if (route.kind === 'home') {
    view = <HomeView categories={catalog.categories} />;
  } else if (route.kind === 'category') {
    const category = categoriesById.get(route.id);
    view = category ? <CategoryView category={category} drinks={drinksForCategory(category.id)} /> : null;
  } else if (route.kind === 'drink') {
    const drink = drinksById.get(route.id);
    const category = drink ? categoriesById.get(drink.category) : undefined;
    const recipe = drink ? resolvedRecipesByDrinkId.get(drink.id) : undefined;
    view = drink && category && recipe ? <DrinkView key={drink.id} category={category} drink={drink} recipe={recipe} /> : null;
  } else {
    view = <UnavailableView hash={route.hash} />;
  }

  return <div class="app-shell"><AppHeader />{view}<SiteFooter /></div>;
}
