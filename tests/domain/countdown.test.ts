import { calculateCountdown } from '../../src/domain/countdown';

const ms = (s: string) => new Date(s).getTime();

const calc = (occurrence: string, now: string, extra: object = {}) =>
  calculateCountdown({
    occurrence: ms(occurrence),
    now: ms(now),
    direction: 'down',
    unit: 'auto',
    ...extra,
  });

describe('calculateCountdown - auto unit selection', () => {
  it('uses days for anything under a month', () => {
    const r = calc('2026-03-25T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('days');
    expect(r.value).toBe(11);
  });

  it('uses months between one month and one year', () => {
    const r = calc('2026-06-14T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('months');
    expect(r.value).toBe(3);
  });

  it('uses years at one year or more', () => {
    const r = calc('2027-03-14T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('years');
    expect(r.value).toBe(1);
  });

  it('never auto-selects weeks', () => {
    const r = calc('2026-06-12T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('months');
  });
});

describe('calculateCountdown - explicit units', () => {
  it('honours an explicit weeks unit', () => {
    const r = calc('2026-05-13T00:00:00', '2026-03-14T00:00:00', { unit: 'weeks' });
    expect(r.unit).toBe('weeks');
    expect(r.totalDays).toBe(60);
    expect(r.value).toBe(8);
    expect(r.remainderDays).toBe(4);
  });

  it('honours an explicit days unit', () => {
    const r = calc('2026-03-14T00:00:00', '2026-03-04T00:00:00', { unit: 'days' });
    expect(r.unit).toBe('days');
    expect(r.value).toBe(10);
  });
});

describe('calculateCountdown - calendar days', () => {
  it('shows 1 for an event later today', () => {
    const r = calc('2026-03-14T18:00:00', '2026-03-14T09:00:00');
    expect(r.value).toBe(1);
    expect(r.isPast).toBe(false);
  });

  it('shows 1 for an event at 6pm tomorrow, all day tomorrow', () => {
    const r = calc('2026-03-15T18:00:00', '2026-03-14T09:00:00');
    expect(r.value).toBe(1);
  });

  it('does not flip to 0 at midnight before a tomorrow event', () => {
    const evening = calc('2026-03-15T18:00:00', '2026-03-14T23:59:00');
    const midnight = calc('2026-03-15T18:00:00', '2026-03-15T00:00:00');
    expect(evening.value).toBe(1);
    expect(midnight.value).toBe(1);
  });
});

describe('calculateCountdown - count-up direction', () => {
  it('counts elapsed days since a past event', () => {
    const r = calculateCountdown({
      occurrence: ms('2026-01-14T00:00:00'),
      now: ms('2026-03-14T00:00:00'),
      direction: 'up',
      unit: 'days',
    });
    expect(r.value).toBe(59);
    expect(r.isPast).toBe(false);
  });

  it('reports isPast when the count-up target has not happened yet', () => {
    const r = calculateCountdown({
      occurrence: ms('2027-01-14T00:00:00'),
      now: ms('2026-03-14T00:00:00'),
      direction: 'up',
      unit: 'days',
    });
    expect(r.isPast).toBe(true);
    expect(r.value).toBeGreaterThan(0);
  });
});

describe('calculateCountdown - past events', () => {
  it('flags a missed one-off and still reports the elapsed magnitude', () => {
    const r = calc('2026-03-01T00:00:00', '2026-03-14T00:00:00');
    expect(r.isPast).toBe(true);
    expect(r.value).toBe(13);
  });
});

describe('calculateCountdown - remainder', () => {
  it('reports leftover days below the chosen unit', () => {
    const r = calc('2027-05-14T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('years');
    expect(r.value).toBe(1);
    expect(r.remainderDays).toBe(61);
  });
});
