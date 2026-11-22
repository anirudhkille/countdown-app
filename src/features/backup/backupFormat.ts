import type { Countdown, Direction, Recurrence, Unit } from '../../domain/types';

export interface BackupFile {
  app: 'countdown';
  version: 1;
  exportedAt: number;
  countdowns: Countdown[];
}

export interface ParsedBackup {
  countdowns: Countdown[];
  malformed: number;
}

const RECURRENCES: Recurrence[] = ['none', 'weekly', 'monthly', 'yearly'];
const DIRECTIONS: Direction[] = ['down', 'up'];
const UNITS: Unit[] = ['auto', 'days', 'weeks', 'months', 'years'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseCountdown(value: unknown): Countdown | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const targetDate = number(value.targetDate);
  if (!id || targetDate === null || targetDate <= 0) return null;

  const createdAt = number(value.createdAt) ?? targetDate;
  const updatedAt = number(value.updatedAt) ?? createdAt;
  const anchorDay = number(value.anchorDay);

  return {
    id,
    title: text(value.title),
    notes: optionalText(value.notes),
    targetDate,
    anchorDay: anchorDay !== null && anchorDay >= 1 && anchorDay <= 31 ? anchorDay : null,
    recurrence: RECURRENCES.includes(value.recurrence as Recurrence)
      ? (value.recurrence as Recurrence)
      : 'none',
    direction: DIRECTIONS.includes(value.direction as Direction)
      ? (value.direction as Direction)
      : 'down',
    unit: UNITS.includes(value.unit as Unit) ? (value.unit as Unit) : 'auto',
    showTime: value.showTime === true,
    color: optionalText(value.color),
    remindAt: number(value.remindAt),
    calendarEventId: optionalText(value.calendarEventId),
    pinned: value.pinned === true,
    archived: value.archived === true,
    createdAt,
    updatedAt,
  };
}

export function buildBackup(countdowns: Countdown[], now: number): string {
  const payload: BackupFile = {
    app: 'countdown',
    version: 1,
    exportedAt: now,
    countdowns,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackup(raw: string): ParsedBackup {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error('This file is not valid JSON.');
  }

  const rows = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.countdowns)
      ? payload.countdowns
      : null;

  if (!rows) throw new Error('This file is not a Countdown backup.');

  const countdowns: Countdown[] = [];
  let malformed = 0;
  for (const row of rows) {
    const parsed = parseCountdown(row);
    if (parsed) countdowns.push(parsed);
    else malformed += 1;
  }

  if (countdowns.length === 0 && malformed > 0) {
    throw new Error('This backup does not contain any readable countdowns.');
  }

  return { countdowns, malformed };
}
