import { buildShareText } from '../../src/features/share/shareText';
import type { Countdown, CountdownValue } from '../../src/domain/types';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 9).getTime();
const longDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function countdown(overrides: Partial<Countdown> = {}): Countdown {
  return {
    id: 'id',
    title: 'Trip to Lisbon',
    notes: null,
    targetDate: at(2027, 3, 14),
    anchorDay: null,
    recurrence: 'none',
    direction: 'down',
    unit: 'days',
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

function value(overrides: Partial<CountdownValue> = {}): CountdownValue {
  return {
    unit: 'days',
    value: 12,
    remainderDays: 0,
    totalDays: 12,
    isPast: false,
    ...overrides,
  };
}

describe('buildShareText', () => {
  it('includes the title, value and date', () => {
    expect(buildShareText(countdown(), value())).toBe(
      ['Trip to Lisbon', '12 days left', longDate(at(2027, 3, 14))].join('\n')
    );
  });

  it('uses the resolved occurrence for a repeating countdown', () => {
    const c = countdown({ recurrence: 'weekly' });
    expect(buildShareText(c, value(), at(2027, 3, 21))).toContain(
      `Repeats every week, ${longDate(at(2027, 3, 21))}`
    );
  });

  it('falls back to the date when the title is empty', () => {
    expect(buildShareText(countdown({ title: '   ' }), value())).toMatch(
      new RegExp(`^${longDate(at(2027, 3, 14))}`)
    );
  });

  it('reports a past countdown as time ago', () => {
    expect(buildShareText(countdown(), value({ isPast: true }))).toContain('12 days ago');
  });
});
