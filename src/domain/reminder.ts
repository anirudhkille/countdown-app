import { resolveOccurrence } from './recurrence';
import type { Countdown } from './types';

export function nextReminderAt(countdown: Countdown, now: number): number | null {
  if (countdown.archived || countdown.remindAt === null) return null;

  const lead = countdown.targetDate - countdown.remindAt;
  if (lead < 0) return null;

  if (countdown.recurrence === 'none') {
    return countdown.remindAt > now ? countdown.remindAt : null;
  }

  const occurrence = resolveOccurrence(
    countdown.targetDate,
    countdown.recurrence,
    now + lead,
    countdown.anchorDay
  );

  return occurrence - lead;
}
