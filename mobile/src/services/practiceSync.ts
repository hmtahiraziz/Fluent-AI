import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../api/endpoints';
import {
  getTodayPracticeMilliseconds,
  localDayKey,
} from './practiceTimeStorage';

const SYNCED_PREFIX = '@fluentai/practice_synced_ms/';
const PENDING_PREFIX = '@fluentai/practice_pending_sync/';

function syncedKey(userId: string, dayKey: string) {
  return `${SYNCED_PREFIX}${userId}/${dayKey}`;
}

function pendingKey(userId: string) {
  return `${PENDING_PREFIX}${userId}`;
}

async function readSyncedMs(userId: string, dayKey: string): Promise<number> {
  const raw = await AsyncStorage.getItem(syncedKey(userId, dayKey));
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function writeSyncedMs(
  userId: string,
  dayKey: string,
  ms: number,
): Promise<void> {
  await AsyncStorage.setItem(
    syncedKey(userId, dayKey),
    String(Math.max(0, Math.floor(ms))),
  );
}

type PendingPayload = { date: string; durationMs: number };

async function writePending(
  userId: string,
  payload: PendingPayload,
): Promise<void> {
  await AsyncStorage.setItem(pendingKey(userId), JSON.stringify(payload));
}

async function clearPending(userId: string): Promise<void> {
  await AsyncStorage.removeItem(pendingKey(userId));
}

async function readPending(userId: string): Promise<PendingPayload | null> {
  const raw = await AsyncStorage.getItem(pendingKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingPayload;
    if (
      typeof parsed?.date === 'string' &&
      typeof parsed?.durationMs === 'number'
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Reconcile local checkpoint with last successful sync, then PUT cumulative total.
 * Does not invent time for crash gaps — only persists max(local, lastSynced).
 */
export async function syncPracticeCumulative(
  userId: string | null | undefined,
  opts?: { date?: string; durationMs?: number },
): Promise<void> {
  if (!userId) return;
  const date = opts?.date ?? localDayKey();
  const localMs =
    opts?.durationMs ?? (await getTodayPracticeMilliseconds(userId));
  const lastSynced = await readSyncedMs(userId, date);
  const durationMs = Math.max(localMs, lastSynced);

  const payload = { date, durationMs };
  try {
    const result = await api.upsertPracticeDaily(payload);
    await writeSyncedMs(userId, date, result.durationMs);
    await clearPending(userId);
  } catch {
    await writePending(userId, payload);
  }
}

/** Retry user-scoped pending sync after reconnect / foreground. */
export async function retryPendingPracticeSync(
  userId: string | null | undefined,
): Promise<void> {
  if (!userId) return;
  const pending = await readPending(userId);
  if (!pending) {
    await syncPracticeCumulative(userId);
    return;
  }
  await syncPracticeCumulative(userId, pending);
}
