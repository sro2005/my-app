import { describe, expect, test } from 'vitest';
import { formatCop } from './currency';

describe('formatCop', () => {
  test('keeps whole-peso prices in the existing compact format', () => {
    const expected = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(149900);

    expect(formatCop(149900)).toBe(expected);
  });

  test('preserves cents instead of rounding a product price to whole pesos', () => {
    const expected = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(149900.5);

    expect(formatCop(149900.5)).toBe(expected);
    expect(formatCop('149900.50')).toBe(expected);
  });

  test('falls back to zero for missing or invalid amounts', () => {
    expect(formatCop(Number.NaN)).toBe(formatCop(0));
    expect(formatCop(undefined)).toBe(formatCop(0));
  });
});
