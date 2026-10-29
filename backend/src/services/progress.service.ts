import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  practiceDailyMinutes,
  vocabularyItems,
  vocabularyReviews,
} from "../db/schema";
import { AppError } from "../middleware/errorHandler";
import {
  REVIEW_SUCCESS_RATINGS,
  assertValidTimeZone,
  endOfZonedDayUtc,
  formatDateInTimeZone,
  isValidLocalDateKey,
  lastNLocalDays,
  startOfZonedDayUtc,
} from "./progressTime";

const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
const DAY_MS_REASONABLE_PAST = 400;

export type WeeklyDayProgress = {
  date: string;
  practiceMinutes: number;
  wordsLearned: number;
  wordsReviewed: number;
  reviewSuccesses: number;
  reviewTotal: number;
};

export type WeeklyProgressResponse = {
  timeZone: string;
  days: WeeklyDayProgress[];
  totals: {
    practiceMinutes: number;
    wordsLearned: number;
    wordsReviewed: number;
    reviewSuccesses: number;
    reviewTotal: number;
  };
  /**
   * Product heuristic: (good|easy) / completed reviews this week.
   * Null when there are no completed reviews. Not a proficiency score.
   */
  reviewSuccessRate: number | null;
};

function msToWholeMinutes(ms: number): number {
  return Math.max(0, Math.floor(ms / 60_000));
}

export async function upsertPracticeDaily(input: {
  userId: string;
  date: string;
  durationMs: number;
}) {
  if (!isValidLocalDateKey(input.date)) {
    throw new AppError(400, "Invalid practice date");
  }
  if (
    !Number.isInteger(input.durationMs) ||
    input.durationMs < 0 ||
    input.durationMs > MAX_DURATION_MS
  ) {
    throw new AppError(400, "Invalid durationMs");
  }

  const todayUtc = new Date();
  const dateUtc = new Date(`${input.date}T12:00:00.000Z`);
  const diffDays =
    Math.abs(todayUtc.getTime() - dateUtc.getTime()) / (24 * 3600_000);
  if (diffDays > DAY_MS_REASONABLE_PAST) {
    throw new AppError(400, "Practice date out of allowed range");
  }

  const db = getDb();
  const [row] = await db
    .insert(practiceDailyMinutes)
    .values({
      userId: input.userId,
      practiceDate: input.date,
      durationMs: input.durationMs,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        practiceDailyMinutes.userId,
        practiceDailyMinutes.practiceDate,
      ],
      set: {
        durationMs: sql`GREATEST(${practiceDailyMinutes.durationMs}, ${input.durationMs})`,
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    date: input.date,
    durationMs: row?.durationMs ?? input.durationMs,
  };
}

export async function getWeeklyProgress(
  userId: string,
  timeZone: string,
  now = new Date(),
): Promise<WeeklyProgressResponse> {
  try {
    assertValidTimeZone(timeZone);
  } catch {
    throw new AppError(400, "Invalid timeZone");
  }

  const dayKeys = lastNLocalDays(timeZone, 7, now);
  const rangeStart = startOfZonedDayUtc(dayKeys[0]!, timeZone);
  const rangeEnd = endOfZonedDayUtc(dayKeys[dayKeys.length - 1]!, timeZone);

  const db = getDb();

  const practiceRowsFull = await db
    .select({
      practiceDate: practiceDailyMinutes.practiceDate,
      durationMs: practiceDailyMinutes.durationMs,
    })
    .from(practiceDailyMinutes)
    .where(
      and(
        eq(practiceDailyMinutes.userId, userId),
        sql`${practiceDailyMinutes.practiceDate} >= ${dayKeys[0]!}`,
        sql`${practiceDailyMinutes.practiceDate} <= ${dayKeys[dayKeys.length - 1]!}`,
      ),
    );

  const practiceByDay = new Map<string, number>();
  for (const row of practiceRowsFull) {
    practiceByDay.set(String(row.practiceDate), row.durationMs);
  }

  const learnedRows = await db
    .select({
      createdAt: vocabularyItems.createdAt,
    })
    .from(vocabularyItems)
    .where(
      and(
        eq(vocabularyItems.userId, userId),
        isNull(vocabularyItems.deletedAt),
        gte(vocabularyItems.createdAt, rangeStart),
        lt(vocabularyItems.createdAt, rangeEnd),
      ),
    );

  const reviewRows = await db
    .select({
      createdAt: vocabularyReviews.createdAt,
      rating: vocabularyReviews.rating,
    })
    .from(vocabularyReviews)
    .where(
      and(
        eq(vocabularyReviews.userId, userId),
        eq(vocabularyReviews.status, "completed"),
        gte(vocabularyReviews.createdAt, rangeStart),
        lt(vocabularyReviews.createdAt, rangeEnd),
      ),
    );

  const learnedByDay = new Map<string, number>();
  for (const row of learnedRows) {
    const key = formatDateInTimeZone(row.createdAt, timeZone);
    learnedByDay.set(key, (learnedByDay.get(key) ?? 0) + 1);
  }

  const reviewedByDay = new Map<
    string,
    { total: number; successes: number }
  >();
  for (const row of reviewRows) {
    const key = formatDateInTimeZone(row.createdAt, timeZone);
    const cur = reviewedByDay.get(key) ?? { total: 0, successes: 0 };
    cur.total += 1;
    if (REVIEW_SUCCESS_RATINGS.has(row.rating)) cur.successes += 1;
    reviewedByDay.set(key, cur);
  }

  const days: WeeklyDayProgress[] = dayKeys.map((date) => {
    const review = reviewedByDay.get(date) ?? { total: 0, successes: 0 };
    return {
      date,
      practiceMinutes: msToWholeMinutes(practiceByDay.get(date) ?? 0),
      wordsLearned: learnedByDay.get(date) ?? 0,
      wordsReviewed: review.total,
      reviewSuccesses: review.successes,
      reviewTotal: review.total,
    };
  });

  const totals = days.reduce(
    (acc, d) => {
      acc.practiceMinutes += d.practiceMinutes;
      acc.wordsLearned += d.wordsLearned;
      acc.wordsReviewed += d.wordsReviewed;
      acc.reviewSuccesses += d.reviewSuccesses;
      acc.reviewTotal += d.reviewTotal;
      return acc;
    },
    {
      practiceMinutes: 0,
      wordsLearned: 0,
      wordsReviewed: 0,
      reviewSuccesses: 0,
      reviewTotal: 0,
    },
  );

  const reviewSuccessRate =
    totals.reviewTotal === 0
      ? null
      : totals.reviewSuccesses / totals.reviewTotal;

  return { timeZone, days, totals, reviewSuccessRate };
}

/** Pure helper for unit tests — Review Success Rate definition. */
export function computeReviewSuccessRate(
  successes: number,
  total: number,
): number | null {
  if (total <= 0) return null;
  return successes / total;
}
