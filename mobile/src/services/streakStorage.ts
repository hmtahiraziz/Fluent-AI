import AsyncStorage from '@react-native-async-storage/async-storage';
import { LAST_PRACTICE_KEY } from '../config/constants';

export const STREAK_COUNT_KEY = '@ailanguage/streak_count';

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

export async function getStreakDisplay(): Promise<string> {
  const [countRaw, lastDate] = await Promise.all([
    AsyncStorage.getItem(STREAK_COUNT_KEY),
    AsyncStorage.getItem(LAST_PRACTICE_KEY),
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

export async function recordPracticeDay(): Promise<number> {
  const today = todayString();
  const lastDate = await AsyncStorage.getItem(LAST_PRACTICE_KEY);

  if (lastDate === today) {
    const countRaw = await AsyncStorage.getItem(STREAK_COUNT_KEY);
    const count = countRaw ? Number.parseInt(countRaw, 10) : 1;
    return Math.max(count, 1);
  }

  let count = 1;
  if (lastDate === yesterdayString()) {
    const countRaw = await AsyncStorage.getItem(STREAK_COUNT_KEY);
    count = (countRaw ? Number.parseInt(countRaw, 10) : 0) + 1;
  }

  await AsyncStorage.multiSet([
    [LAST_PRACTICE_KEY, today],
    [STREAK_COUNT_KEY, String(count)],
  ]);

  return count;
}
