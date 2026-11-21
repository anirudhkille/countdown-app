import { formatCountdownValue, formatUnitLabel } from '../../domain/format';
import type { Countdown, CountdownValue } from '../../domain/types';

const RECURRENCE_TEXT = {
  weekly: 'Repeats every week',
  monthly: 'Repeats every month',
  yearly: 'Repeats every year',
} as const;

export function buildShareText(
  countdown: Countdown,
  value: CountdownValue,
  occurrence: number = countdown.targetDate
): string {
  const date = new Date(occurrence).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const title = countdown.title.trim() || date;
  const repeat = countdown.recurrence === 'none' ? null : RECURRENCE_TEXT[countdown.recurrence];
  return [
    title,
    `${formatCountdownValue(value.value)} ${formatUnitLabel(value.unit, value.value, countdown.direction)}`,
    repeat ? `${repeat}, ${date}` : date,
  ].join('\n');
}
