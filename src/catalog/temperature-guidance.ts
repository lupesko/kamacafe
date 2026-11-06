import type { TemperatureGuidance, TemperatureRange } from './types';

function isRange(guidance: TemperatureGuidance): guidance is TemperatureRange {
  return typeof guidance !== 'number';
}

export function assertValidTemperatureGuidance(guidance: TemperatureGuidance): void {
  const values = isRange(guidance) ? [guidance.min, guidance.max] : [guidance];
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new RangeError('Temperature guidance must stay between 0°C and 100°C');
  }
  if (isRange(guidance) && guidance.min > guidance.max) {
    throw new RangeError('Temperature guidance range must be ordered');
  }
}

export function formatTemperatureGuidance(guidance: TemperatureGuidance): string {
  assertValidTemperatureGuidance(guidance);
  return isRange(guidance)
    ? `${guidance.min}–${guidance.max}°C`
    : `${guidance}°C`;
}

export function temperatureGuidanceEquals(
  first: TemperatureGuidance,
  second: TemperatureGuidance,
): boolean {
  assertValidTemperatureGuidance(first);
  assertValidTemperatureGuidance(second);
  if (typeof first === 'number' || typeof second === 'number') return first === second;
  return first.min === second.min && first.max === second.max;
}
