import { remainingFraction } from '../../src/domain/progress';
import type { Countdown } from '../../src/domain/types';

const ms = (s: string) => new Date(s).getTime();

const base: Pick<Countdown, 'createdAt' | 'recurrence' | 'anchorDay' | 'direction'> = {
  createdAt: ms('2026-01-01T09:00:00'),
  recurrence: 'none',
  anchorDay: null,
  direction: 'down',
};

describe('remainingFraction', () => {
  it('starts full when a one-off countdown is created', () => {
    expect(remainingFraction(base, ms('2026-01-21T09:00:00'), base.createdAt)).toBe(1);
  });

  it('drains across the whole wait, not a fixed window', () => {
    const occurrence = ms('2026-01-21T09:00:00');
    expect(remainingFraction(base, occurrence, ms('2026-01-11T09:00:00'))).toBeCloseTo(0.5, 5);
    expect(remainingFraction(base, occurrence, ms('2026-01-16T09:00:00'))).toBeCloseTo(0.25, 5);
  });

  it('leaves a small arc near a distant date', () => {
    const occurrence = ms('2026-04-11T09:00:00');
    const value = remainingFraction(base, occurrence, ms('2026-04-06T09:00:00'));
    expect(value).toBeCloseTo(0.05, 5);
  });

  it('is empty at the date and after it', () => {
    const occurrence = ms('2026-01-21T09:00:00');
    expect(remainingFraction(base, occurrence, occurrence)).toBe(0);
    expect(remainingFraction(base, occurrence, ms('2026-02-01T09:00:00'))).toBe(0);
  });

  it('refills each week for a weekly countdown', () => {
    const weekly = { ...base, recurrence: 'weekly' as const };
    const occurrence = ms('2026-06-10T09:00:00');
    expect(remainingFraction(weekly, occurrence, ms('2026-06-07T09:00:00'))).toBeCloseTo(3 / 7, 5);
  });

  it('refills each month for a monthly countdown', () => {
    const monthly = { ...base, recurrence: 'monthly' as const, anchorDay: 31 };
    const occurrence = ms('2026-05-31T09:00:00');
    expect(remainingFraction(monthly, occurrence, ms('2026-05-15T09:00:00'))).toBeCloseTo(16 / 31, 5);
  });

  it('refills each year for a yearly countdown', () => {
    const yearly = { ...base, recurrence: 'yearly' as const, anchorDay: 15 };
    const occurrence = ms('2027-06-15T09:00:00');
    expect(remainingFraction(yearly, occurrence, ms('2026-12-15T09:00:00'))).toBeCloseTo(0.5, 2);
  });

  it('stays full for count-up countdowns', () => {
    const up = { ...base, direction: 'up' as const };
    expect(remainingFraction(up, ms('2026-01-01T09:00:00'), ms('2026-06-01T09:00:00'))).toBe(1);
  });
});
