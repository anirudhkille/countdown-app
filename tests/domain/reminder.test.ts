import { nextReminderAt } from '../../src/domain/reminder';
import type { Countdown } from '../../src/domain/types';

const at = (y: number, m: number, d: number, h = 9, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();
const hour = 3_600_000;
const day = 24 * hour;

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
    remindAt: null,
    calendarEventId: null,
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('nextReminderAt', () => {
  it('returns the reminder time for a future one-off event', () => {
    const remindAt = at(2026, 6, 1) - day;
    const c = countdown({ targetDate: at(2026, 6, 1), remindAt });
    expect(nextReminderAt(c, at(2026, 5, 1))).toBe(remindAt);
  });

  it('returns null when a one-off reminder has passed', () => {
    const remindAt = at(2026, 6, 1) - day;
    const c = countdown({ targetDate: at(2026, 6, 1), remindAt });
    expect(nextReminderAt(c, at(2026, 6, 2))).toBeNull();
  });

  it('skips the past weekly reminder and plans the next one', () => {
    const target = at(2026, 1, 5);
    const c = countdown({ targetDate: target, recurrence: 'weekly', remindAt: target - 7 * day });
    expect(nextReminderAt(c, at(2026, 1, 5, 10))).toBe(at(2026, 1, 12));
  });

  it('plans a weekly reminder one day ahead', () => {
    const target = at(2026, 1, 5);
    const c = countdown({ targetDate: target, recurrence: 'weekly', remindAt: target - day });
    expect(nextReminderAt(c, at(2026, 1, 5, 10))).toBe(at(2026, 1, 11));
  });

  it('plans a monthly reminder one week ahead', () => {
    const target = at(2026, 1, 20);
    const c = countdown({ targetDate: target, recurrence: 'monthly', remindAt: target - 7 * day });
    expect(nextReminderAt(c, at(2026, 2, 18))).toBe(at(2026, 3, 13));
  });

  it('keeps the same-day reminder when the event is later today', () => {
    const target = at(2026, 1, 5, 18);
    const c = countdown({ targetDate: target, remindAt: target - 2 * hour });
    expect(nextReminderAt(c, at(2026, 1, 5, 10))).toBe(at(2026, 1, 5, 16));
  });

  it('returns null for an archived countdown', () => {
    const c = countdown({
      targetDate: at(2026, 6, 1),
      remindAt: at(2026, 6, 1) - day,
      archived: true,
    });
    expect(nextReminderAt(c, at(2026, 5, 1))).toBeNull();
  });

  it('returns null when the reminder is after the event', () => {
    const c = countdown({ targetDate: at(2026, 6, 1), remindAt: at(2026, 6, 2) });
    expect(nextReminderAt(c, at(2026, 5, 1))).toBeNull();
  });
});
