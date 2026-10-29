import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { userSettings } from "../db/schema";

export const LLM_CONSENT_VERSION = "2026-03-27";

export function serializeSettings(row: typeof userSettings.$inferSelect) {
  return {
    targetLanguage: row.targetLanguage,
    nativeLanguage: row.nativeLanguage,
    level: row.level,
    motivation: row.motivation ?? "fun",
    onboardingCompleted: row.onboardingCompleted,
    dailyGoalMinutes: row.dailyGoalMinutes,
    llmConsentVersion: row.llmConsentVersion,
    llmConsentAt: row.llmConsentAt?.toISOString() ?? null,
    hasLlmConsent: row.llmConsentVersion === LLM_CONSENT_VERSION,
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
