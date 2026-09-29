import * as Calendar from 'expo-calendar';

export interface ImportableEvent {
  id: string;
  title: string;
  date: number;
  allDay: boolean;
  notes: string | null;
}

export async function hasCalendarPermission(): Promise<boolean> {
  const status = await Calendar.getCalendarPermissions();
  if (status.granted) return true;
  const requested = await Calendar.requestCalendarPermissions();
  return requested.granted;
}

export async function listImportableEvents(
  from: Date,
  to: Date
): Promise<ImportableEvent[]> {
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
