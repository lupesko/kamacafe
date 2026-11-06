import { describe, expect, it } from 'vitest';
import {
  formatTemperatureGuidance,
  temperatureGuidanceEquals,
} from '../../src/catalog/temperature-guidance';

describe('temperature guidance', () => {
  it('formats numeric temperatures with one Celsius suffix', () => {
    expect(formatTemperatureGuidance(94)).toBe('94°C');
  });

  it('formats ranges with an en dash and one Celsius suffix', () => {
    expect(formatTemperatureGuidance({ min: 90, max: 91 })).toBe('90–91°C');
  });

  it('compares values structurally without mutating range objects', () => {
    const first = { min: 90, max: 91 } as const;
    const before = structuredClone(first);

    expect(temperatureGuidanceEquals(first, { min: 90, max: 91 })).toBe(true);
    expect(temperatureGuidanceEquals(first, { min: 90, max: 92 })).toBe(false);
    expect(temperatureGuidanceEquals(90, 90)).toBe(true);
    expect(temperatureGuidanceEquals(90, { min: 90, max: 90 })).toBe(false);
    expect(first).toEqual(before);
  });

  it.each([
    [-1],
    [101],
    [{ min: 91, max: 90 }],
    [{ min: -1, max: 90 }],
    [{ min: 90, max: 101 }],
  ])('rejects invalid guidance %j', (guidance) => {
    expect(() => formatTemperatureGuidance(guidance)).toThrow(/temperature/i);
  });
});
