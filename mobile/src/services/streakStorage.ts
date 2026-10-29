import AsyncStorage from '@react-native-async-storage/async-storage';
import { LAST_PRACTICE_KEY } from '../config/constants';

/** Legacy device-global keys (pre user-scoping). Removed after migrate / logout wipe. */
export const STREAK_COUNT_KEY = '@ailanguage/streak_count';

function scopedCountKey(userId: string) {
  return `${STREAK_COUNT_KEY}/${userId}`;
}

function scopedLastPracticeKey(userId: string) {
  return `${LAST_PRACTICE_KEY}/${userId}`;
}

export function formatStreakLabel(count: number): string {
  if (count <= 0) return 'Start today';
  if (count === 1) return '1 Day';
  return `${count} Days`;
}

function todayString() {
  return new Date().toDateString();
}

function yesterdayString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toDateString();
}

/** One-shot: move unscoped streak into the current user's keys, then drop legacy. */
async function migrateLegacyStreak(userId: string): Promise<void> {
  const [legacyCount, legacyLast, scopedCount, scopedLast] = await Promise.all([
    AsyncStorage.getItem(STREAK_COUNT_KEY),
    AsyncStorage.getItem(LAST_PRACTICE_KEY),
    AsyncStorage.getItem(scopedCountKey(userId)),
    AsyncStorage.getItem(scopedLastPracticeKey(userId)),
  ]);

  if (!legacyCount && !legacyLast) return;

  const writes: Record<string, string> = {};
  if (!scopedCount && legacyCount) {
    writes[scopedCountKey(userId)] = legacyCount;
  }
  if (!scopedLast && legacyLast) {
    writes[scopedLastPracticeKey(userId)] = legacyLast;
  }
  if (Object.keys(writes).length > 0) {
    await AsyncStorage.setMany(writes);
  }
  await AsyncStorage.removeMany([STREAK_COUNT_KEY, LAST_PRACTICE_KEY]);
}

export async function getStreakDisplay(userId: string | null | undefined): Promise<string> {
  if (!userId) return formatStreakLabel(0);

  await migrateLegacyStreak(userId);

  const [countRaw, lastDate] = await Promise.all([
    AsyncStorage.getItem(scopedCountKey(userId)),
    AsyncStorage.getItem(scopedLastPracticeKey(userId)),
  ]);

  const count = countRaw ? Number.parseInt(countRaw, 10) : 0;
  const today = todayString();

  if (!lastDate) {
    return formatStreakLabel(0);
  }

  if (lastDate === today) {
    return formatStreakLabel(Math.max(count, 1));
  }

  if (lastDate === yesterdayString()) {
    return formatStreakLabel(Math.max(count, 1));
  }

  return formatStreakLabel(0);
}

export async function recordPracticeDay(userId: string | null | undefined): Promise<number> {
  if (!userId) return 0;

  await migrateLegacyStreak(userId);

  const today = todayString();
  const countKey = scopedCountKey(userId);
  const lastKey = scopedLastPracticeKey(userId);
  const lastDate = await AsyncStorage.getItem(lastKey);

  if (lastDate === today) {
    const countRaw = await AsyncStorage.getItem(countKey);
    const count = countRaw ? Number.parseInt(countRaw, 10) : 1;
    return Math.max(count, 1);
  }

  let count = 1;
  if (lastDate === yesterdayString()) {
    const countRaw = await AsyncStorage.getItem(countKey);
    count = (countRaw ? Number.parseInt(countRaw, 10) : 0) + 1;
  }

  await AsyncStorage.setMany({
    [lastKey]: today,
    [countKey]: String(count),
  });

  return count;
}
