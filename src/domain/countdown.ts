import type { CountdownValue, Direction, ResolvedUnit, Unit } from './types';
import {
  addMonths,
  addYears,
  calendarDayDiff,
  monthsBetween,
  yearsBetween,
} from './dateMath';

export interface CalculateCountdownInput {
  occurrence: number;
  now: number;
  direction: Direction;
  unit: Unit;
  anchorDay?: number | null;
}

function pickAutoUnit(from: Date, to: Date): ResolvedUnit {
  if (yearsBetween(from, to) >= 1) return 'years';
  if (monthsBetween(from, to) >= 1) return 'months';
  return 'days';
}

function consumedDays(
  from: Date,
  unit: ResolvedUnit,
  value: number,
  anchor: number
): number {
  switch (unit) {
    case 'days':
      return value;
    case 'weeks':
      return value * 7;
    case 'months':
      return calendarDayDiff(from, addMonths(from, value, anchor));
    case 'years':
      return calendarDayDiff(from, addYears(from, value, anchor));
  }
}

export function calculateCountdown(input: CalculateCountdownInput): CountdownValue {
  const { occurrence, now, direction, unit } = input;
  const anchor = input.anchorDay ?? new Date(occurrence).getDate();

  const earlier = direction === 'down' ? now : occurrence;
  const later = direction === 'down' ? occurrence : now;

  const from = new Date(earlier);
  const to = new Date(later);

  const isPast = direction === 'down' ? occurrence < now : now < occurrence;

  let totalDays = Math.abs(calendarDayDiff(from, to));
  if (direction === 'down' && !isPast && totalDays === 0) {
    totalDays = 1;
  }

  const chosen: ResolvedUnit = unit === 'auto' ? pickAutoUnit(from, to) : unit;

  let value: number;
  switch (chosen) {
    case 'days':
      value = totalDays;
      break;
    case 'weeks':
      value = Math.floor(totalDays / 7);
      break;
    case 'months':
      value = Math.max(0, monthsBetween(from, to));
      break;
    case 'years':
      value = Math.max(0, yearsBetween(from, to));
      break;
  }

  const remainderDays = Math.max(0, totalDays - consumedDays(from, chosen, value, anchor));

  return { unit: chosen, value, remainderDays, totalDays, isPast };
}
