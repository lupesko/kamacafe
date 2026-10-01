import { describe, expect, it } from 'vitest';
import { categoryHash, drinkHash, parseHash } from '../../src/routing/hash-route';

describe('hash route grammar', () => {
  it.each(['', '#'])('treats %j as home', (hash) => {
    expect(parseHash(hash)).toEqual({ kind: 'home' });
  });

  it('parses and formats stable category IDs', () => {
    expect(parseHash('#category-espresso-drink')).toEqual({ kind: 'category', id: 'espresso-drink' });
    expect(categoryHash('espresso-drink')).toBe('#category-espresso-drink');
  });

  it('parses and formats stable drink IDs', () => {
    expect(parseHash('#espresso')).toEqual({ kind: 'drink', id: 'espresso' });
    expect(drinkHash('espresso')).toBe('#espresso');
  });

  it.each(['#category-', '#UPPER', '#bad_slug', '#category-Bad'])('rejects %s as unavailable', (hash) => {
    expect(parseHash(hash)).toEqual({ kind: 'unavailable', hash });
  });
});
