import { getDb, type CountdownRow } from './db';
import { parseReminders } from '../domain/reminder';
import type {
  Countdown,
  CountdownDraft,
  Direction,
  Recurrence,
  Unit,
} from '../domain/types';

export function fromRow(r: CountdownRow): Countdown {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes,
    targetDate: r.target_date,
    anchorDay: r.anchor_day,
    recurrence: asRecurrence(r.recurrence),
    direction: asDirection(r.direction),
    unit: asUnit(r.unit),
    showTime: r.show_time === 1,
    color: r.color,
    reminders: parseReminders(r.reminders, r.remind_at, r.target_date),
    calendarEventId: r.calendar_event_id,
    pinned: r.pinned === 1,
    archived: r.archived === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function asRecurrence(value: string): Recurrence {
  return value === 'weekly' || value === 'monthly' || value === 'yearly' ? value : 'none';
}

function asDirection(value: string): Direction {
  return value === 'up' ? 'up' : 'down';
}

function asUnit(value: string): Unit {
  return value === 'days' || value === 'weeks' || value === 'months' || value === 'years'
    ? value
    : 'auto';
}

export function toRow(c: Countdown): CountdownRow {
  return {
    id: c.id,
    title: c.title,
    notes: c.notes,
    target_date: c.targetDate,
    anchor_day: c.anchorDay,
    recurrence: c.recurrence,
    direction: c.direction,
    unit: c.unit,
    show_time: c.showTime ? 1 : 0,
    color: c.color,
    reminders: JSON.stringify(c.reminders),
    remind_at: null,
    calendar_event_id: c.calendarEventId,
    pinned: c.pinned ? 1 : 0,
    archived: c.archived ? 1 : 0,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export async function listCountdowns(includeArchived = false): Promise<Countdown[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CountdownRow>(
    includeArchived
      ? 'SELECT * FROM countdowns'
      : 'SELECT * FROM countdowns WHERE archived = 0'
  );
  return rows.map(fromRow);
}

export async function listAllCountdowns(): Promise<Countdown[]> {
  return listCountdowns(true);
}

export async function getCountdown(id: string): Promise<Countdown | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CountdownRow>(
    'SELECT * FROM countdowns WHERE id = ?',
    id
  );
  return row ? fromRow(row) : null;
}

async function insertRecord(record: Countdown): Promise<void> {
  const db = await getDb();
  const r = toRow(record);
  await db.runAsync(
    `INSERT INTO countdowns (
      id, title, notes, target_date, anchor_day, recurrence, direction, unit,
      show_time, color, reminders, remind_at, calendar_event_id, pinned,
      archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    r.id, r.title, r.notes, r.target_date, r.anchor_day, r.recurrence, r.direction, r.unit,
    r.show_time, r.color, r.reminders, r.remind_at, r.calendar_event_id, r.pinned,
    r.archived, r.created_at, r.updated_at
  );
}

export async function createCountdown(
  draft: CountdownDraft,
  id: string,
  now: number
): Promise<Countdown> {
  const record: Countdown = {
    ...draft,
    id,
    calendarEventId: draft.calendarEventId ?? null,
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await insertRecord(record);
  return record;
}

export async function insertCountdown(record: Countdown): Promise<void> {
  await insertRecord(record);
}

export async function updateCountdown(
  id: string,
  draft: CountdownDraft,
  now: number
): Promise<void> {
  const db = await getDb();
  const result = await db.runAsync(
    `UPDATE countdowns SET
      title = ?, notes = ?, target_date = ?, anchor_day = ?, recurrence = ?,
      direction = ?, unit = ?, show_time = ?, color = ?,
      reminders = ?, remind_at = NULL, calendar_event_id = ?, updated_at = ?
    WHERE id = ?`,
    draft.title,
    draft.notes,
    draft.targetDate,
    draft.anchorDay ?? null,
    draft.recurrence,
    draft.direction,
    draft.unit,
    draft.showTime ? 1 : 0,
    draft.color,
    JSON.stringify(draft.reminders),
    draft.calendarEventId ?? null,
    now,
    id
  );
  if (result.changes === 0) throw new Error('Countdown not found');
}

export async function deleteCountdown(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM countdowns WHERE id = ?', id);
}

export async function deleteAllCountdowns(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM countdowns');
}

export async function setPinned(id: string, pinned: boolean, now: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE countdowns SET pinned = ?, updated_at = ? WHERE id = ?',
    pinned ? 1 : 0,
    now,
    id
  );
}

export async function setArchived(id: string, archived: boolean, now: number): Promise<void> {
  const db = await getDb();
  if (archived) {
    await db.runAsync(
      'UPDATE countdowns SET archived = 1, pinned = 0, updated_at = ? WHERE id = ?',
      now,
      id
    );
    return;
  }
  await db.runAsync(
    'UPDATE countdowns SET archived = 0, updated_at = ? WHERE id = ?',
    now,
    id
  );
}

export async function calendarEventExists(eventId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ found: number }>(
    'SELECT 1 AS found FROM countdowns WHERE calendar_event_id = ? LIMIT 1',
    eventId
  );
  return row !== null;
}
