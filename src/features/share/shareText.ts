import { formatCountdownValue, formatUnitLabel } from '../../domain/format';
import type { Countdown, CountdownValue } from '../../domain/types';

export function buildShareText(countdown: Countdown, value: CountdownValue): string {
  const date = new Date(countdown.targetDate).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return [
    countdown.title,
    `${formatCountdownValue(value.value)} ${formatUnitLabel(value.unit, value.value, countdown.direction)}`,
    `${countdown.recurrence !== 'none' ? `Repeats ${countdown.recurrence} · ` : ''}${date}`,
  ].join('\n');
}
