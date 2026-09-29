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

/**
 * Loading the module is not proof it works: in Expo Go the JS module resolves but the
 * first native call rejects, because the calendar native module is not bundled. The
 * first such failure latches `nativeUsable` to false so the UI can offer the
 * development-build message instead of a permission prompt that can never succeed.
 */
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
