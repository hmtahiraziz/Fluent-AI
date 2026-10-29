import { and, eq, sql } from "drizzle-orm";
import { getEnv } from "../config/env";
import { getDb } from "../db";
import { aiDailyUsage } from "../db/schema";
import { AppError } from "../middleware/errorHandler";

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Atomically consume one AI request against the user's daily quota. */
export async function consumeAiQuota(userId: string): Promise<void> {
  const db = getDb();
  const quota = getEnv().AI_DAILY_QUOTA;
  const usageDate = utcDateString();

  await db
    .insert(aiDailyUsage)
    .values({ userId, usageDate, requestCount: 0 })
    .onConflictDoNothing({
      target: [aiDailyUsage.userId, aiDailyUsage.usageDate],
    });

  const updated = await db
    .update(aiDailyUsage)
    .set({ requestCount: sql`${aiDailyUsage.requestCount} + 1` })
    .where(
      and(
        eq(aiDailyUsage.userId, userId),
        eq(aiDailyUsage.usageDate, usageDate),
        sql`${aiDailyUsage.requestCount} < ${quota}`,
      ),
    )
    .returning({ requestCount: aiDailyUsage.requestCount });

  if (updated.length === 0) {
    throw new AppError(429, "Daily AI practice limit reached. Try again tomorrow.");
  }
}
