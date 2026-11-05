export interface ItineraryDay {
  id: string;
  day_number: number;
  date: string;
  city: string;
  title: string;
  description: string;
  map_url?: string;
}

const MONTHS_SHORT_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function sortDaysByDate<T extends { id: string; date: string }>(days: T[]): T[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function getDayNumberById(days: { id: string; date: string }[]): Map<string, number> {
  return new Map(sortDaysByDate(days).map((d, i) => [d.id, i + 1]));
}

export function daysBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso + 'T00:00:00').getTime() - new Date(startIso + 'T00:00:00').getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function formatDayMonth(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_SHORT_ES[d.getMonth()]}`;
}

export function formatDayMonthRange(firstIso: string, lastIso: string): string {
  const year = new Date(lastIso + 'T00:00:00').getFullYear();
  if (firstIso === lastIso) return `${formatDayMonth(firstIso)} ${year}`;
  return `${formatDayMonth(firstIso)} – ${formatDayMonth(lastIso)} ${year}`;
}
