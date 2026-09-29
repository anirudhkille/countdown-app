import { getDb, type CountdownRow } from './db';
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
    recurrence: r.recurrence as Recurrence,
    direction: r.direction as Direction,
    unit: r.unit as Unit,
    showTime: r.show_time === 1,
    themeId: r.theme_id,
    color: r.color,
    fontFamily: r.font_family,
    emoji: r.emoji,
    remindAt: r.remind_at,
    calendarEventId: r.calendar_event_id,
    archived: r.archived === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
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
    theme_id: c.themeId,
    color: c.color,
    font_family: c.fontFamily,
    emoji: c.emoji,
    remind_at: c.remindAt,
    calendar_event_id: c.calendarEventId,
    archived: c.archived ? 1 : 0,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export async function listCountdowns(): Promise<Countdown[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CountdownRow>(
    'SELECT * FROM countdowns WHERE archived = 0'
  );
  return rows.map(fromRow);
}

export async function getCountdown(id: string): Promise<Countdown | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CountdownRow>(
    'SELECT * FROM countdowns WHERE id = ?',
    id
  );
  return row ? fromRow(row) : null;
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
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  const r = toRow(record);
  await db.runAsync(
    `INSERT INTO countdowns (
      id, title, notes, target_date, anchor_day, recurrence, direction, unit,
      show_time, theme_id, color, font_family, emoji, remind_at, calendar_event_id,
      archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    r.id, r.title, r.notes, r.target_date, r.anchor_day, r.recurrence, r.direction, r.unit,
    r.show_time, r.theme_id, r.color, r.font_family, r.emoji, r.remind_at, r.calendar_event_id,
    r.archived, r.created_at, r.updated_at
  );
  return record;
}

export async function updateCountdown(
  id: string,
  draft: CountdownDraft,
  now: number
): Promise<void> {
  const db = await getDb();
  const r = toRow({
    ...draft,
    id,
    calendarEventId: draft.calendarEventId ?? null,
    archived: false,
    createdAt: now,
    updatedAt: now,
  });
  await db.runAsync(
    `UPDATE countdowns SET
      title = ?, notes = ?, target_date = ?, anchor_day = ?, recurrence = ?,
      direction = ?, unit = ?, show_time = ?, theme_id = ?, color = ?,
      font_family = ?, emoji = ?, remind_at = ?, calendar_event_id = ?, updated_at = ?
    WHERE id = ?`,
    r.title, r.notes, r.target_date, r.anchor_day, r.recurrence, r.direction, r.unit,
    r.show_time, r.theme_id, r.color, r.font_family, r.emoji, r.remind_at,
    r.calendar_event_id, r.updated_at, id
  );
}

export async function deleteCountdown(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM countdowns WHERE id = ?', id);
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE countdowns SET archived = ?, updated_at = ? WHERE id = ?',
    archived ? 1 : 0,
    Date.now(),
    id
  );
}
