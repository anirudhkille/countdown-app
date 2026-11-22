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

export function formatPreciseRemaining(occurrence: number, now: number): string | null {
  const remaining = occurrence - now;
  if (remaining <= 0 || remaining >= 86_400_000) return null;
  const minutes = Math.floor(remaining / 60_000);
  if (minutes < 1) return 'under a minute';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${rest}m`;
}
