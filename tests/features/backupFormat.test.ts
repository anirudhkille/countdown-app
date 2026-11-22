import { buildBackup, parseBackup } from '../../src/features/backup/backupFormat';
import type { Countdown } from '../../src/domain/types';

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
    remindAt: null,
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
    expect(parsed.version).toBe(1);
    expect(parsed.countdowns).toHaveLength(1);
  });
});

describe('parseBackup', () => {
  it('round-trips every field', () => {
    const original = countdown({ pinned: true, archived: true });
    const parsed = parseBackup(buildBackup([original], 123));
    expect(parsed.malformed).toBe(0);
    expect(parsed.countdowns[0]).toEqual(original);
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
    });
  });

  it('rejects invalid JSON', () => {
    expect(() => parseBackup('{nope')).toThrow('not valid JSON');
  });

  it('rejects a file that is not a backup', () => {
    expect(() => parseBackup('{"hello":true}')).toThrow('not a Countdown backup');
  });
});
