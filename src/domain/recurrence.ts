import type { Recurrence } from './types';
import { addDays, addMonths, addYears } from './dateMath';

const MAX_ITERATIONS = 5000;

function step(
  date: Date,
  recurrence: Exclude<Recurrence, 'none'>,
  anchor: number
): Date {
  switch (recurrence) {
    case 'weekly':
      return addDays(date, 7);
    case 'monthly':
      return addMonths(date, 1, anchor);
    case 'yearly':
      return addYears(date, 1, anchor);
  }
}

export function resolveOccurrence(
  targetDate: number,
  recurrence: Recurrence,
  now: number,
  anchorDay: number | null
): number {
  if (recurrence === 'none') return targetDate;

  const anchor = anchorDay ?? new Date(targetDate).getDate();
  let current = new Date(targetDate);

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    if (current.getTime() > now) break;
    current = step(current, recurrence, anchor);
  }

  return current.getTime();
}
