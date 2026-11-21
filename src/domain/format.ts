import type { Direction, ResolvedUnit } from './types';

const PLURAL: Record<ResolvedUnit, string> = {
  days: 'days',
  weeks: 'weeks',
  months: 'months',
  years: 'years',
};

const SINGULAR: Record<ResolvedUnit, string> = {
  days: 'day',
  weeks: 'week',
  months: 'month',
  years: 'year',
};

export function formatCountdownValue(value: number): string {
  return Math.abs(Math.trunc(value)).toLocaleString('en-US');
}

export function formatUnitLabel(
  unit: ResolvedUnit,
  count: number,
  direction: Direction,
  isPast = false
): string {
  const word = Math.abs(count) === 1 ? SINGULAR[unit] : PLURAL[unit];
  if (direction === 'down' && isPast) return `${word} ago`;
  return direction === 'down' ? `${word} left` : `${word} since`;
}
