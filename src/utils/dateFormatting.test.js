import { describe, expect, test } from 'vitest';
import { formatBogotaDate, formatBogotaDateTime } from './dateFormatting';

describe('Bogota date formatting', () => {
  test('formats date and time in the Bogota time zone without a third-party library', () => {
    expect(formatBogotaDateTime('2026-10-20T15:00:00.000Z')).toBe('20/10/2026 · 10:00');
  });

  test('supports seconds and a custom separator for customer order history', () => {
    expect(formatBogotaDateTime('2026-10-20T15:00:00.000Z', {
      includeSeconds: true,
      separator: ' - ',
      fallback: 'Fecha no disponible'
    })).toBe('20/10/2026 - 10:00:00');
  });

  test('uses Bogota local date when the UTC instant crosses a calendar boundary', () => {
    expect(formatBogotaDate('2026-01-01T02:00:00.000Z')).toBe('31/12/2025');
  });

  test('uses the supplied fallback for absent or invalid values', () => {
    expect(formatBogotaDate(null, 'Sin fecha')).toBe('Sin fecha');
    expect(formatBogotaDateTime('not-a-date', { fallback: 'No disponible' })).toBe('No disponible');
  });
});
