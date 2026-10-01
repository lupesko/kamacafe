import type { AppRoute, Catalog, CatalogIdRegistry } from '../catalog/types';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseHash(hash: string): AppRoute {
  if (hash === '' || hash === '#') return { kind: 'home' };
  if (!hash.startsWith('#')) return { kind: 'unavailable', hash };

  const value = hash.slice(1);
  if (value.startsWith('category-')) {
    const id = value.slice('category-'.length);
    return slugPattern.test(id) ? { kind: 'category', id } : { kind: 'unavailable', hash };
  }
  return slugPattern.test(value) ? { kind: 'drink', id: value } : { kind: 'unavailable', hash };
}

export const categoryHash = (id: string) => `#category-${id}`;
export const drinkHash = (id: string) => `#${id}`;

export function resolveHashRoute(hash: string, catalog: Catalog, registry: CatalogIdRegistry): AppRoute {
  const route = parseHash(hash);
  if (route.kind === 'home' || route.kind === 'unavailable') return route;
  const active = registry.records.some(
    (record) => record.id === route.id && record.kind === route.kind && record.status === 'active',
  );
  const exists = route.kind === 'category'
    ? catalog.categories.some(({ id }) => id === route.id)
    : catalog.drinks.some(({ id }) => id === route.id);
  return active && exists ? route : { kind: 'unavailable', hash };
}
