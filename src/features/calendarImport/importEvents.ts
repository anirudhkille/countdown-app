import type * as Calendar from 'expo-calendar';

export interface ImportableEvent {
  id: string;
  title: string;
  date: number;
  allDay: boolean;
  notes: string | null;
}

let cached: typeof Calendar | null | undefined;
let nativeUsable = true;

function getCalendar(): typeof Calendar | null {
  if (cached !== undefined) return cached;
  try {
    cached = require('expo-calendar') as typeof Calendar;
  } catch {
    cached = null;
  }
  return cached;
}

export function isCalendarAvailable(): boolean {
  return getCalendar() !== null && nativeUsable;
}

export async function hasCalendarPermission(): Promise<boolean> {
  const Calendar = getCalendar();
  if (!Calendar) return false;
  try {
    const status = await Calendar.getCalendarPermissions();
    if (status.granted) return true;
    const requested = await Calendar.requestCalendarPermissions();
    return requested.granted;
  } catch {
    nativeUsable = false;
    return false;
  }
}

export async function listImportableEvents(
  from: Date,
  to: Date
): Promise<ImportableEvent[]> {
  const Calendar = getCalendar();
  if (!Calendar) return [];
  try {
    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
    if (calendars.length === 0) return [];

    const events = await Calendar.listEvents(calendars, from, to);

    return events
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: new Date(e.startDate).getTime(),
        allDay: e.allDay,
        notes: e.notes,
      }))
      .sort((a, b) => a.date - b.date);
  } catch {
    nativeUsable = false;
    return [];
  }
}
