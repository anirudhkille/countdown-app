import { addDays, addMonths, addYears } from './dateMath';
import { resolveOccurrence } from './recurrence';
import type { Countdown, Reminder } from './types';

const MINUTE = 60_000;
const MAX_ITERATIONS = 600;

function fireFor(occurrence: number, reminder: Reminder): number {
  if (reminder.kind === 'offset') return occurrence - reminder.minutes * MINUTE;
  const date = new Date(occurrence);
  date.setHours(reminder.hour, reminder.minute, 0, 0);
  return date.getTime();
}

function advance(date: number, recurrence: Exclude<Countdown['recurrence'], 'none'>, anchor: number) {
  const current = new Date(date);
  if (recurrence === 'weekly') return addDays(current, 7).getTime();
  if (recurrence === 'monthly') return addMonths(current, 1, anchor).getTime();
  return addYears(current, 1, anchor).getTime();
}

export function nextReminderFire(
  countdown: Countdown,
  reminder: Reminder,
  now: number
): number | null {
  if (countdown.archived) return null;

  if (countdown.recurrence === 'none') {
    const fireAt = fireFor(countdown.targetDate, reminder);
    return fireAt > now ? fireAt : null;
  }

  const recurrence = countdown.recurrence;
  const anchor = countdown.anchorDay ?? new Date(countdown.targetDate).getDate();
  let occurrence = resolveOccurrence(countdown.targetDate, recurrence, now - 1, anchor);

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const fireAt = fireFor(occurrence, reminder);
    if (fireAt > now) return fireAt;
    occurrence = advance(occurrence, recurrence, anchor);
  }

  return null;
}

function validReminder(value: unknown, index: number): Reminder | null {
  if (typeof value !== 'object' || value === null) return null;
  const entry = value as Record<string, unknown>;
  const id =
    typeof entry.id === 'string' && entry.id.length > 0 ? entry.id : `reminder-${index}`;

  if (entry.kind === 'offset') {
    const minutes = entry.minutes;
    if (typeof minutes !== 'number' || !Number.isFinite(minutes)) return null;
    if (minutes < 0 || minutes > 525_600) return null;
    return { id, kind: 'offset', minutes: Math.round(minutes) };
  }

  if (entry.kind === 'time') {
    const hour = entry.hour;
    const minute = entry.minute;
    if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) return null;
    if (typeof minute !== 'number' || !Number.isInteger(minute) || minute < 0 || minute > 59) {
      return null;
    }
    return { id, kind: 'time', hour, minute };
  }

  return null;
}

export function normalizeReminders(value: unknown): Reminder[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 20)
    .map(validReminder)
    .filter((reminder): reminder is Reminder => reminder !== null);
}

export function legacyReminders(remindAt: number | null, targetDate: number): Reminder[] {
  if (remindAt === null || !Number.isFinite(remindAt)) return [];
  const minutes = Math.round((targetDate - remindAt) / MINUTE);
  if (minutes < 0) return [];
  return [{ id: 'legacy', kind: 'offset', minutes }];
}

export function parseReminders(
  json: string | null,
  legacyRemindAt: number | null,
  targetDate: number
): Reminder[] {
  if (json) {
    try {
      const parsed = normalizeReminders(JSON.parse(json));
      if (parsed.length > 0) return parsed;
    } catch {
      return legacyReminders(legacyRemindAt, targetDate);
    }
  }
  return legacyReminders(legacyRemindAt, targetDate);
}

export function reminderLabel(reminder: Reminder): string {
  if (reminder.kind === 'time') {
    const value = new Date(2000, 0, 1, reminder.hour, reminder.minute);
    const time = value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `On the day at ${time}`;
  }

  const { minutes } = reminder;
  if (minutes === 0) return 'At the start time';
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? '1 day before' : `${days} days before`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? '1 hour before' : `${hours} hours before`;
  }
  return minutes === 1 ? '1 minute before' : `${minutes} minutes before`;
}

export const REMINDER_PRESETS: Reminder[] = [
  { id: 'preset-morning', kind: 'time', hour: 9, minute: 0 },
  { id: 'preset-start', kind: 'offset', minutes: 0 },
  { id: 'preset-hour', kind: 'offset', minutes: 60 },
  { id: 'preset-day', kind: 'offset', minutes: 1440 },
  { id: 'preset-week', kind: 'offset', minutes: 10_080 },
];
