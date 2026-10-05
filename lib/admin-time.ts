/** Every clock in the admin space. France, including summer time. */
export const ADMIN_TIME_ZONE = "Europe/Paris";

const monthFormat = new Intl.DateTimeFormat("en-US", { timeZone: ADMIN_TIME_ZONE, month: "short" });

const partFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ADMIN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parts(date: Date): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of partFormat.formatToParts(date)) {
    if (part.type !== "literal") out[part.type] = part.value;
  }
  return out;
}

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Oct 5, 2026, 19:08" — Paris, 24-hour. */
export function formatAdminWhen(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return "—";
  const p = parts(date);
  return `${monthFormat.format(date)} ${Number(p.day)}, ${p.year}, ${p.hour}:${p.minute}`;
}

/** "Oct 5, 2026" in Paris. */
export function formatAdminDate(value: Date | string | null | undefined): string {
  const date = asDate(value);
  if (!date) return "—";
  const p = parts(date);
  return `${monthFormat.format(date)} ${Number(p.day)}, ${p.year}`;
}

/** "YYYY-MM-DD" of the Paris calendar day. */
export function parisDayKey(date: Date): string {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** UTC instant of 00:00 on the Paris day that contains `date`. */
export function parisMidnight(date: Date): Date {
  const p = parts(date);
  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  const guess = Date.UTC(year, month - 1, day);
  const shown = parts(new Date(guess));
  const shownAsUtc = Date.UTC(
    Number(shown.year),
    Number(shown.month) - 1,
    Number(shown.day),
    Number(shown.hour),
    Number(shown.minute),
    Number(shown.second),
  );
  const target = Date.UTC(year, month - 1, day);
  return new Date(guess - (shownAsUtc - target));
}

export type ParisDay = { key: string; start: Date; label: string };

/** The last `count` Paris calendar days, oldest first. Today is last. */
export function recentParisDays(count: number, now = new Date()): ParisDay[] {
  const days: ParisDay[] = [];
  let cursor = parisMidnight(now);
  for (let i = 0; i < count; i++) {
    const p = parts(cursor);
    days.push({
      key: parisDayKey(cursor),
      start: cursor,
      label: `${monthFormat.format(cursor)} ${Number(p.day)}`,
    });
    cursor = parisMidnight(new Date(cursor.getTime() - 12 * 60 * 60 * 1000));
  }
  return days.reverse();
}
