import { useEffect, useState } from 'preact/hooks';
import { catalog, idRegistry } from '../catalog/load';
import { resolveHashRoute } from './hash-route';

export function useHashRoute() {
  const current = () => resolveHashRoute(window.location.hash, catalog, idRegistry);
  const [route, setRoute] = useState(current);

  useEffect(() => {
    const update = () => setRoute(current());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  return route;
}
