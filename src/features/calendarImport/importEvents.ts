import type * as Calendar from 'expo-calendar';

export interface ImportableEvent {
  id: string;
  title: string;
  date: number;
  allDay: boolean;
  notes: string | null;
}

/**
 * `expo-calendar` is unsupported in Expo Go (device only), so the module is loaded
 * lazily behind a try/catch for the same reason as `expo-notifications`: a top-level
 * import would make this route unopenable rather than simply unavailable.
 */
let cached: typeof Calendar | null | undefined;

function getCalendar(): typeof Calendar | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-calendar') as typeof Calendar;  } catch {
    cached = null;
  }
  return cached;
}

export function isCalendarAvailable(): boolean {
  return getCalendar() !== null;
}

export async function hasCalendarPermission(): Promise<boolean> {
  const Calendar = getCalendar();
  if (!Calendar) return false;
  const status = await Calendar.getCalendarPermissions();
  if (status.granted) return true;
  const requested = await Calendar.requestCalendarPermissions();
  return requested.granted;
}

export async function listImportableEvents(
  from: Date,
  to: Date
): Promise<ImportableEvent[]> {
  const Calendar = getCalendar();
  if (!Calendar) return [];
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
}
