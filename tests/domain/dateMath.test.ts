import {
  daysInMonth,
  startOfDay,
  calendarDayDiff,
  addDays,
  addMonths,
  addYears,
  monthsBetween,
  yearsBetween,
} from '../../src/domain/dateMath';

const d = (s: string) => new Date(s);

describe('daysInMonth', () => {
  it('returns the correct length including leap years', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2025, 1)).toBe(28);
    expect(daysInMonth(2026, 0)).toBe(31);
    expect(daysInMonth(2026, 3)).toBe(30);
  });
});

describe('startOfDay', () => {
  it('strips the time component', () => {
    expect(startOfDay(d('2026-03-14T18:45:12')).getHours()).toBe(0);
    expect(startOfDay(d('2026-03-14T00:00:00')).getDate()).toBe(14);
  });
});

describe('calendarDayDiff', () => {
  it('counts midnights, not 24-hour blocks', () => {
    expect(calendarDayDiff(d('2026-03-14T18:00:00'), d('2026-03-15T18:00:00'))).toBe(1);
    expect(calendarDayDiff(d('2026-03-14T23:59:00'), d('2026-03-15T00:01:00'))).toBe(1);
  });

  it('is negative when `to` is before `from`', () => {
    expect(calendarDayDiff(d('2026-03-15T10:00:00'), d('2026-03-14T10:00:00'))).toBe(-1);
  });

  it('survives a daylight saving transition', () => {
    expect(calendarDayDiff(d('2026-03-07T12:00:00'), d('2026-03-09T12:00:00'))).toBe(2);
  });
});

describe('addDays', () => {
  it('rolls over the month boundary instead of clamping', () => {
    const r = addDays(d('2026-01-31T09:00:00'), 1);
    expect(r.getMonth()).toBe(1);
    expect(r.getDate()).toBe(1);
  });

  it('rolls back across a year boundary', () => {
    const r = addDays(d('2026-01-01T09:00:00'), -1);
    expect(r.getFullYear()).toBe(2025);
    expect(r.getMonth()).toBe(11);
    expect(r.getDate()).toBe(31);
  });
});

describe('addMonths', () => {
  it('clamps the day to the target month length', () => {
    expect(addMonths(d('2026-01-31T09:00:00'), 1).getMonth()).toBe(1);
    expect(addMonths(d('2026-01-31T09:00:00'), 1).getDate()).toBe(28);
  });

  it('honours anchorDay so the original day is not lost', () => {
    const feb = addMonths(d('2026-01-31T09:00:00'), 1, 31);
    expect(feb.getDate()).toBe(28);
    const mar = addMonths(feb, 1, 31);
    expect(mar.getMonth()).toBe(2);
    expect(mar.getDate()).toBe(31);
  });

  it('crosses year boundaries in both directions', () => {
    expect(addMonths(d('2026-11-15T00:00:00'), 3).getFullYear()).toBe(2027);
    expect(addMonths(d('2026-01-15T00:00:00'), -3).getFullYear()).toBe(2025);
  });

  it('preserves the time of day', () => {
    expect(addMonths(d('2026-01-31T14:30:00'), 1).getHours()).toBe(14);
    expect(addMonths(d('2026-01-31T14:30:00'), 1).getMinutes()).toBe(30);
  });
});

describe('addYears', () => {
  it('clamps Feb 29 to Feb 28 in a non-leap year when no anchor is given', () => {
    const r = addYears(d('2024-02-29T00:00:00'), 1);
    expect(r.getFullYear()).toBe(2025);
    expect(r.getDate()).toBe(28);
  });

  it('skips to the next leap year when an anchor day of 29 February is given', () => {
    const r = addYears(d('2024-02-29T00:00:00'), 1, 29);
    expect(r.getFullYear()).toBe(2028);
    expect(r.getMonth()).toBe(1);
    expect(r.getDate()).toBe(29);
  });

  it('preserves the time of day', () => {
    expect(addYears(d('2024-02-29T08:15:00'), 1).getHours()).toBe(8);
    expect(addYears(d('2024-02-29T08:15:00'), 1).getMinutes()).toBe(15);
  });
});

describe('monthsBetween', () => {
  it('counts complete months only', () => {
    expect(monthsBetween(d('2026-01-01T00:00:00'), d('2026-03-01T00:00:00'))).toBe(2);
    expect(monthsBetween(d('2026-01-01T00:00:00'), d('2026-02-28T00:00:00'))).toBe(1);
  });

  it('does not count a month that has not completed', () => {
    expect(monthsBetween(d('2026-01-31T00:00:00'), d('2026-02-28T00:00:00'))).toBe(0);
  });

  it('requires the time of day to match when the day-of-month is equal', () => {
    expect(monthsBetween(d('2026-01-15T12:00:00'), d('2026-02-15T06:00:00'))).toBe(0);
    expect(monthsBetween(d('2026-01-15T06:00:00'), d('2026-02-15T12:00:00'))).toBe(1);
  });
});

describe('yearsBetween', () => {
  it('counts complete years only', () => {
    expect(yearsBetween(d('2020-06-01T00:00:00'), d('2026-06-01T00:00:00'))).toBe(6);
    expect(yearsBetween(d('2026-06-02T00:00:00'), d('2026-06-01T00:00:00'))).toBe(0);
  });
});
