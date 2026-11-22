import { addDays, addMonths } from './dateMath';
import type { Countdown } from './types';

const DAY_MS = 86_400_000;

function cycleStart(
  occurrence: number,
  recurrence: Countdown['recurrence'],
  anchorDay: number | null
): number | null {
  const date = new Date(occurrence);
  switch (recurrence) {
    case 'weekly':
      return addDays(date, -7).getTime();
    case 'monthly':
      return addMonths(date, -1, anchorDay ?? undefined).getTime();
    case 'yearly':
      return addMonths(date, -12, anchorDay ?? undefined).getTime();
    default:
      return null;
  }
}

export function remainingFraction(
  countdown: Pick<Countdown, 'createdAt' | 'recurrence' | 'anchorDay' | 'direction'>,
  occurrence: number,
  now: number
): number {
  if (countdown.direction === 'up') return 1;
  if (now >= occurrence) return 0;

  const start =
    cycleStart(occurrence, countdown.recurrence, countdown.anchorDay) ??
    Math.min(countdown.createdAt, occurrence - DAY_MS);
  const span = occurrence - start;

  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (occurrence - now) / span));
}
