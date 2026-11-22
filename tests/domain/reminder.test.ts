import { nextReminderFire } from '../../src/domain/reminder';
import type { Countdown, Reminder } from '../../src/domain/types';

const at = (y: number, m: number, d: number, h = 9, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

const offset = (minutes: number, id = 'r'): Reminder => ({ id, kind: 'offset', minutes });
const time = (hours: number, minutes: number, id = 't'): Reminder => ({
  id,
  kind: 'time',
  hour: hours,
  minute: minutes,
});

function countdown(overrides: Partial<Countdown>): Countdown {
  return {
    id: 'id',
    title: 'Trip',
    notes: null,
    targetDate: at(2026, 6, 1),
    anchorDay: null,
    recurrence: 'none',
    direction: 'down',
    unit: 'auto',
    showTime: false,
    color: null,
    reminders: [],
    calendarEventId: null,
    pinned: false,
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('nextReminderFire', () => {
  it('returns the reminder time for a future one-off event', () => {
    const c = countdown({
      targetDate: at(2026, 6, 1),
      reminders: [offset(1440)],
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 5, 1))).toBe(at(2026, 5, 31));
  });

  it('returns null when a one-off reminder has passed', () => {
    const c = countdown({
      targetDate: at(2026, 6, 1),
      reminders: [offset(1440)],
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 6, 2))).toBeNull();
  });

  it('skips the past weekly reminder and plans the next one', () => {
    const c = countdown({
      targetDate: at(2026, 1, 5),
      recurrence: 'weekly',
      reminders: [offset(7 * 24 * 60)],
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 1, 5, 10))).toBe(at(2026, 1, 12));
  });

  it('plans a weekly reminder one day ahead', () => {
    const c = countdown({
      targetDate: at(2026, 1, 5),
      recurrence: 'weekly',
      reminders: [offset(1440)],
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 1, 5, 10))).toBe(at(2026, 1, 11));
  });

  it('plans a monthly reminder one week ahead', () => {
    const c = countdown({
      targetDate: at(2026, 1, 20),
      recurrence: 'monthly',
      anchorDay: 20,
      reminders: [offset(7 * 24 * 60)],
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 2, 18))).toBe(at(2026, 3, 13));
  });

  it('keeps the same-day reminder when the event is later today', () => {
    const c = countdown({
      targetDate: at(2026, 1, 5, 18),
      reminders: [offset(120)],
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 1, 5, 10))).toBe(at(2026, 1, 5, 16));
  });

  it('returns null for an archived countdown', () => {
    const c = countdown({
      targetDate: at(2026, 6, 1),
      reminders: [offset(1440)],
      archived: true,
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 5, 1))).toBeNull();
  });

  it('fires a custom time on the day of the event', () => {
    const c = countdown({
      targetDate: at(2026, 6, 1),
      reminders: [time(8, 30)],
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 5, 1))).toBe(at(2026, 6, 1, 8, 30));
  });

  it('returns null when the custom time has already passed today', () => {
    const c = countdown({
      targetDate: at(2026, 6, 1),
      reminders: [time(8, 30)],
    });
    expect(nextReminderFire(c, c.reminders[0], at(2026, 6, 1, 8, 45))).toBeNull();
  });
});
