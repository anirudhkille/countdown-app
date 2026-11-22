export type Recurrence = 'none' | 'weekly' | 'monthly' | 'yearly';

export type Direction = 'down' | 'up';

export type Unit = 'auto' | 'days' | 'weeks' | 'months' | 'years';

export type ResolvedUnit = Exclude<Unit, 'auto'>;

export interface OffsetReminder {
  id: string;
  kind: 'offset';
  minutes: number;
}

export interface TimeReminder {
  id: string;
  kind: 'time';
  hour: number;
  minute: number;
}

export type Reminder = OffsetReminder | TimeReminder;

export interface Countdown {
  id: string;
  title: string;
  notes: string | null;
  targetDate: number;
  anchorDay: number | null;
  recurrence: Recurrence;
  direction: Direction;
  unit: Unit;
  showTime: boolean;
  color: string | null;
  reminders: Reminder[];
  calendarEventId: string | null;
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export type CountdownDraft = Omit<
  Countdown,
  'id' | 'createdAt' | 'updatedAt' | 'archived' | 'pinned' | 'calendarEventId'
> & {
  id?: string;
  calendarEventId?: string | null;
};

export interface CountdownValue {
  unit: ResolvedUnit;
  value: number;
  remainderDays: number;
  totalDays: number;
  isPast: boolean;
}

export type ThemeId = string;
