const MS_PER_DAY = 86_400_000;

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function calendarDayDiff(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

function withTime(source: Date, year: number, month0: number, day: number): Date {
  return new Date(
    year,
    month0,
    day,
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );
}

function withClampedDay(year: number, month0: number, day: number, source: Date): Date {
  return withTime(source, year, month0, Math.min(day, daysInMonth(year, month0)));
}

export function addDays(d: Date, days: number): Date {
  return withTime(d, d.getFullYear(), d.getMonth(), d.getDate() + days);
}

export function addMonths(d: Date, months: number, anchorDay?: number): Date {
  const totalMonths = d.getFullYear() * 12 + d.getMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month0 = ((totalMonths % 12) + 12) % 12;
  return withClampedDay(year, month0, anchorDay ?? d.getDate(), d);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function addYears(d: Date, years: number, anchorDay?: number): Date {
  const month0 = d.getMonth();
  let year = d.getFullYear() + years;

  if (anchorDay === 29 && month0 === 1) {
    while (!isLeapYear(year)) year += 1;
    return withClampedDay(year, month0, 29, d);
  }

  return withClampedDay(year, month0, anchorDay ?? d.getDate(), d);
}

function timeOfDay(d: Date): number {
  return d.getHours() * 3_600_000 + d.getMinutes() * 60_000 + d.getSeconds() * 1000;
}

export function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) {
    months -= 1;
  } else if (to.getDate() === from.getDate() && timeOfDay(to) < timeOfDay(from)) {
    months -= 1;
  }
  return months;
}

export function yearsBetween(from: Date, to: Date): number {
  const years = Math.trunc(monthsBetween(from, to) / 12);
  return years === 0 ? 0 : years;
}

export { MS_PER_DAY };
