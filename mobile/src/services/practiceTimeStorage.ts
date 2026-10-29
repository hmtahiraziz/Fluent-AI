import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = '@fluentai/practice_ms/';

/** Local calendar day key YYYY-MM-DD */
export function localDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
}

function storageKey(userId: string, dayKey: string): string {
  return `${STORAGE_PREFIX}${userId}/${dayKey}`;
}

async function readMs(userId: string, dayKey: string): Promise<number> {
  const raw = await AsyncStorage.getItem(storageKey(userId, dayKey));
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function writeMs(userId: string, dayKey: string, ms: number): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId, dayKey), String(Math.max(0, Math.floor(ms))));
}

/**
 * Add elapsed practice ms, splitting across local midnight if needed.
 * Returns total ms for the current local day after the add.
 */
export async function addPracticeMilliseconds(
  userId: string | null | undefined,
  startMs: number,
  endMs: number,
): Promise<number> {
  if (!userId || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return userId ? readMs(userId, localDayKey()) : 0;
  }

  let cursor = startMs;
  const end = endMs;

  while (cursor < end) {
    const cursorDate = new Date(cursor);
    const dayEnd = endOfLocalDay(cursorDate).getTime();
    const segmentEnd = Math.min(end, dayEnd);
    const delta = segmentEnd - cursor;
    if (delta > 0) {
      const key = localDayKey(cursorDate);
      const prev = await readMs(userId, key);
      await writeMs(userId, key, prev + delta);
    }
    cursor = segmentEnd;
  }

  return readMs(userId, localDayKey(new Date(endMs)));
}

export async function getTodayPracticeMilliseconds(
  userId: string | null | undefined,
): Promise<number> {
  if (!userId) return 0;
  return readMs(userId, localDayKey());
}

/** Whole minutes floored from stored ms (daily goal display). */
export function millisecondsToWholeMinutes(ms: number): number {
  return Math.max(0, Math.floor(ms / 60_000));
}

export async function getTodayPracticeMinutes(
  userId: string | null | undefined,
): Promise<number> {
  const ms = await getTodayPracticeMilliseconds(userId);
  return millisecondsToWholeMinutes(ms);
}

/**
 * Tracks a focused ChatScreen segment. Call start when focused+active;
 * stop when pausing. Safe against double-stop.
 *
 * Crash recovery: only safely persisted ms (via stop/checkpoint) survive.
 * Do not reconstruct wall-clock time across background/inactive gaps.
 */
export class PracticeTimerSession {
  private startedAt: number | null = null;
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  start(now = Date.now()): void {
    if (this.startedAt != null) return;
    this.startedAt = now;
  }

  async stop(now = Date.now()): Promise<number> {
    if (this.startedAt == null) {
      return getTodayPracticeMilliseconds(this.userId);
    }
    const start = this.startedAt;
    this.startedAt = null;
    return addPracticeMilliseconds(this.userId, start, now);
  }

  /**
   * Persist elapsed time since last start/checkpoint, then restart the segment.
   * Used for periodic sync so a crash only loses the last interval.
   */
  async checkpoint(now = Date.now()): Promise<number> {
    if (this.startedAt == null) {
      return getTodayPracticeMilliseconds(this.userId);
    }
    const start = this.startedAt;
    this.startedAt = now;
    return addPracticeMilliseconds(this.userId, start, now);
  }

  isRunning(): boolean {
    return this.startedAt != null;
  }
}
