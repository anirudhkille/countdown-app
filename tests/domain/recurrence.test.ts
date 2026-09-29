import { resolveOccurrence } from '../../src/domain/recurrence';

const ms = (s: string) => new Date(s).getTime();
const iso = (n: number) => new Date(n).toISOString().slice(0, 10);

describe('resolveOccurrence', () => {
  it('returns the target unchanged for a one-off event', () => {
    const t = ms('2026-12-25T00:00:00');
    expect(resolveOccurrence(t, 'none', ms('2026-03-01T00:00:00'), null)).toBe(t);
  });

  it('returns a one-off event unchanged even after it has passed', () => {
    const t = ms('2020-01-01T00:00:00');
    expect(resolveOccurrence(t, 'none', ms('2026-03-01T00:00:00'), null)).toBe(t);
  });

  it('advances weekly past the current occurrence', () => {
    const anchor = ms('2026-01-01T09:00:00');
    const r = resolveOccurrence(anchor, 'weekly', ms('2026-03-04T12:00:00'), null);
    expect(iso(r)).toBe('2026-03-05');
  });

  it('advances yearly for a birthday', () => {
    const anchor = ms('1990-06-15T00:00:00');
    const r = resolveOccurrence(anchor, 'yearly', ms('2026-06-16T00:00:00'), 15);
    expect(iso(r)).toBe('2027-06-15');
  });

  it('does not drift a 31st-of-the-month event across a short month', () => {
    const anchor = ms('2026-01-31T00:00:00');
    const r = resolveOccurrence(anchor, 'monthly', ms('2026-02-15T00:00:00'), 31);
    expect(iso(r)).toBe('2026-02-28');
  });

  it('returns to the 31st the following month rather than staying on the 28th', () => {
    const anchor = ms('2026-01-31T00:00:00');
    const r = resolveOccurrence(anchor, 'monthly', ms('2026-02-28T12:00:00'), 31);
    expect(iso(r)).toBe('2026-03-31');
  });

  it('keeps a leap-day birthday on the leap day', () => {
    const anchor = ms('2024-02-29T00:00:00');
    const r = resolveOccurrence(anchor, 'yearly', ms('2026-06-01T00:00:00'), 29);
    expect(iso(r)).toBe('2028-02-29');
  });

  it('derives the anchor day from targetDate when anchorDay is null', () => {
    const anchor = ms('2026-01-20T00:00:00');
    const r = resolveOccurrence(anchor, 'monthly', ms('2026-02-25T00:00:00'), null);
    expect(iso(r)).toBe('2026-03-20');
  });

  it('keeps weekly recurrence on the same weekday across a month boundary', () => {
    const anchor = ms('2026-01-31T09:00:00');
    const r = resolveOccurrence(anchor, 'weekly', ms('2026-02-10T12:00:00'), null);
    expect(iso(r)).toBe('2026-02-14');
  });

  it('terminates instead of looping forever on a pathological recurrence', () => {
    const anchor = ms('1970-01-01T00:00:00');
    const started = Date.now();
    const r = resolveOccurrence(anchor, 'weekly', ms('2026-03-01T00:00:00'), null);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(iso(r)).toBe('2026-03-05');
  });
});
