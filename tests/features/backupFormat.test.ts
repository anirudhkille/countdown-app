import { buildBackup, parseBackup } from '../../src/features/backup/backupFormat';
import type { Countdown, Reminder } from '../../src/domain/types';

const offset = (minutes: number, id = 'r'): Reminder => ({ id, kind: 'offset', minutes });
const time = (hour: number, minute: number, id = 't'): Reminder => ({
  id,
  kind: 'time',
  hour,
  minute,
});

function countdown(overrides: Partial<Countdown> = {}): Countdown {
  return {
    id: 'one',
    title: 'Trip to Lisbon',
    notes: 'Book the tram',
    targetDate: new Date('2027-03-14T18:00:00').getTime(),
    anchorDay: null,
    recurrence: 'none',
    direction: 'down',
    unit: 'auto',
    showTime: true,
    color: '#D9B44A',
    reminders: [],
    calendarEventId: null,
    pinned: false,
    archived: false,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe('buildBackup', () => {
  it('wraps countdowns in a versioned file', () => {
    const parsed = JSON.parse(buildBackup([countdown()], 123)) as {
      app: string;
      version: number;
      countdowns: Countdown[];
    };
    expect(parsed.app).toBe('countdown');
    expect(parsed.version).toBe(2);
    expect(parsed.countdowns).toHaveLength(1);
  });
});

describe('parseBackup', () => {
  it('round-trips every field', () => {
    const original = countdown({
      pinned: true,
      archived: true,
      reminders: [offset(1440, 'day'), time(9, 0, 'morning')],
    });
    const parsed = parseBackup(buildBackup([original], 123));
    expect(parsed.malformed).toBe(0);
    expect(parsed.countdowns[0]).toEqual(original);
  });

  it('converts a legacy absolute reminder into an offset reminder', () => {
    const targetDate = new Date('2027-03-14T18:00:00').getTime();
    const parsed = parseBackup(
      JSON.stringify([
        {
          id: 'legacy',
          title: 'Legacy',
          targetDate,
          remindAt: targetDate - 86_400_000,
        },
      ])
    );
    expect(parsed.countdowns[0].reminders).toEqual([
      { id: 'legacy', kind: 'offset', minutes: 1440 },
    ]);
  });

  it('accepts a bare array from an older export', () => {
    const parsed = parseBackup(JSON.stringify([countdown()]));
    expect(parsed.countdowns).toHaveLength(1);
  });

  it('skips unreadable rows and counts them', () => {
    const payload = JSON.stringify({ countdowns: [countdown(), { id: 'broken' }, null] });
    const parsed = parseBackup(payload);
    expect(parsed.countdowns).toHaveLength(1);
    expect(parsed.malformed).toBe(2);
  });

  it('defaults missing optional fields instead of rejecting the row', () => {
    const parsed = parseBackup(
      JSON.stringify([
        {
          id: 'minimal',
          title: 'Minimal',
          targetDate: 1_800_000_000_000,
        },
      ])
    );
    expect(parsed.countdowns[0]).toMatchObject({
      recurrence: 'none',
      direction: 'down',
      unit: 'auto',
      pinned: false,
      archived: false,
      reminders: [],
    });
  });

  it('rejects invalid JSON', () => {
    expect(() => parseBackup('{nope')).toThrow('not valid JSON');
  });

  it('rejects a file that is not a backup', () => {
    expect(() => parseBackup('{"hello":true}')).toThrow('not a Countdown backup');
  });
});
