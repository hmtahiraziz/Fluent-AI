/**
 * IANA timezone helpers for weekly progress.
 * All calendar-day math uses the requested timezone — never the server local TZ.
 */

export function assertValidTimeZone(timeZone: string): void {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
  } catch {
    throw new Error("INVALID_TIMEZONE");
  }
}

export function isValidLocalDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m! - 1 &&
    dt.getUTCDate() === d
  );
}

function partsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** YYYY-MM-DD for `date` as seen in `timeZone`. */
export function formatDateInTimeZone(date: Date, timeZone: string): string {
  const p = partsInTimeZone(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * UTC instant for local calendar day `dayKey` at 00:00:00 in `timeZone`.
 */
export function startOfZonedDayUtc(dayKey: string, timeZone: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number) as [number, number, number];
  let guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  for (let i = 0; i < 4; i++) {
    const p = partsInTimeZone(new Date(guess), timeZone);
    const asUtc = Date.UTC(
      p.year,
      p.month - 1,
      p.day,
      p.hour,
      p.minute,
      p.second,
    );
    const desired = Date.UTC(y, m - 1, d, 0, 0, 0);
    const delta = desired - asUtc;
    if (delta === 0) break;
    guess += delta;
  }
  return new Date(guess);
}

export function endOfZonedDayUtc(dayKey: string, timeZone: string): Date {
  const start = startOfZonedDayUtc(dayKey, timeZone);
  const nextInstant = new Date(start.getTime() + 36 * 3600_000);
  const nextKey = formatDateInTimeZone(nextInstant, timeZone);
  if (nextKey !== dayKey) {
    return startOfZonedDayUtc(nextKey, timeZone);
  }
  // DST / edge: walk hour-by-hour until the local date changes
  let cursor = start.getTime() + 3600_000;
  for (let i = 0; i < 48; i++) {
    const key = formatDateInTimeZone(new Date(cursor), timeZone);
    if (key !== dayKey) {
      return startOfZonedDayUtc(key, timeZone);
    }
    cursor += 3600_000;
  }
  return new Date(start.getTime() + 24 * 3600_000);
}

/** Last `count` local calendar days ending on today in `timeZone` (inclusive). */
export function lastNLocalDays(
  timeZone: string,
  count: number,
  now = new Date(),
): string[] {
  const days: string[] = [];
  let dayKey = formatDateInTimeZone(now, timeZone);
  for (let i = 0; i < count; i++) {
    days.unshift(dayKey);
    const start = startOfZonedDayUtc(dayKey, timeZone);
    dayKey = formatDateInTimeZone(new Date(start.getTime() - 1), timeZone);
  }
  return days;
}

/** Success ratings for Review Success Rate product heuristic. */
export const REVIEW_SUCCESS_RATINGS = new Set(["good", "easy"]);
