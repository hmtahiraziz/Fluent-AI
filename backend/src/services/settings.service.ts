import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { userSettings } from "../db/schema";

export function serializeSettings(row: typeof userSettings.$inferSelect) {
  return {
    targetLanguage: row.targetLanguage,
    nativeLanguage: row.nativeLanguage,
    level: row.level,
    onboardingCompleted: row.onboardingCompleted,
    dailyGoalMinutes: row.dailyGoalMinutes,
  };
}

export async function getSettingsForUser(userId: string) {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return settings ?? null;
}
