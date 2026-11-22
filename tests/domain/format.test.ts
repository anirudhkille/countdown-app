import {
  formatCountdownValue,
  formatPreciseRemaining,
  formatUnitLabel,
} from '../../src/domain/format';

describe('formatCountdownValue', () => {
  it('groups thousands', () => {
    expect(formatCountdownValue(1204)).toBe('1,204');
    expect(formatCountdownValue(999)).toBe('999');
  });
});

describe('formatUnitLabel', () => {
  it('pluralises correctly', () => {
    expect(formatUnitLabel('days', 1, 'down')).toBe('day left');
    expect(formatUnitLabel('days', 5, 'down')).toBe('days left');
    expect(formatUnitLabel('days', 1, 'up')).toBe('day since');
    expect(formatUnitLabel('years', 3, 'up')).toBe('years since');
  });

  it('uses the past tense for expired countdowns', () => {
    expect(formatUnitLabel('days', 1, 'down', true)).toBe('day ago');
    expect(formatUnitLabel('days', 13, 'down', true)).toBe('days ago');
  });
});

describe('formatPreciseRemaining', () => {
  const now = new Date('2026-06-01T12:00:00').getTime();

  it('shows hours and minutes inside the final day', () => {
    expect(formatPreciseRemaining(now + 3 * 3_600_000 + 20 * 60_000, now)).toBe('3h 20m');
  });

  it('shows minutes when less than an hour remains', () => {
    expect(formatPreciseRemaining(now + 45 * 60_000, now)).toBe('45m');
  });

  it('rounds partial minutes down', () => {
    expect(formatPreciseRemaining(now + 59_999, now)).toBe('under a minute');
  });

  it('returns null at the target or beyond a day away', () => {
    expect(formatPreciseRemaining(now, now)).toBeNull();
    expect(formatPreciseRemaining(now - 1, now)).toBeNull();
    expect(formatPreciseRemaining(now + 86_400_000, now)).toBeNull();
  });
});
