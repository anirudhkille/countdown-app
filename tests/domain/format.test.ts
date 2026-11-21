import { formatCountdownValue, formatUnitLabel } from '../../src/domain/format';

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
