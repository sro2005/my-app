import { afterEach, describe, expect, test, vi } from 'vitest';
import { getTodayInBogota, getLatestAdultBirthDate, isAdult } from './RegistroCliente';

afterEach(() => {
  vi.useRealTimers();
});

describe('RegistroCliente age validation', () => {
  test('uses Colombia calendar day when current UTC date differs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T04:30:00.000Z'));

    expect(getTodayInBogota()).toBe('2025-12-31');
    expect(isAdult('2007-12-31')).toBe(true);
    expect(isAdult('2008-01-01')).toBe(false);
    expect(getLatestAdultBirthDate()).toBe('2007-12-31');
  });

  test('rejects impossible, malformed and underage birth dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T16:00:00.000Z'));

    expect(isAdult('2025-02-29')).toBe(false);
    expect(isAdult('15/06/2000')).toBe(false);
    expect(isAdult('2008-06-16')).toBe(false);
    expect(isAdult('2008-06-15')).toBe(true);
  });
});
