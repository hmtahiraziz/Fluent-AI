import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  CEFR_LEVELS,
  isValidLanguage,
  isValidLevel,
} from "../constants/languages";
import { getDb } from "../db";
import { userSettings } from "../db/schema";
import { authMiddleware, getUserId } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { serializeSettings } from "../services/settings.service";

const patchSchema = z
  .object({
    targetLanguage: z.string().min(2).max(5).optional(),
    nativeLanguage: z.string().min(2).max(5).optional(),
    level: z.enum(CEFR_LEVELS).optional(),
    onboardingCompleted: z.boolean().optional(),
    dailyGoalMinutes: z.number().int().min(5).max(120).optional(),
  })
  .refine(
    (d) =>
      d.targetLanguage !== undefined ||
      d.nativeLanguage !== undefined ||
      d.level !== undefined ||
      d.onboardingCompleted !== undefined ||
      d.dailyGoalMinutes !== undefined,
    { message: "Provide at least one field to update" },
  );

export const settingsRouter = Router();

settingsRouter.use(authMiddleware);

settingsRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings) {
      throw new AppError(404, "Settings not found");
    }

    res.json(serializeSettings(settings));
  } catch (e) {
    next(e);
  }
});

settingsRouter.patch("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = patchSchema.parse(req.body);

    if (body.targetLanguage && !isValidLanguage(body.targetLanguage)) {
      throw new AppError(400, "Unsupported target language");
    }
    if (body.nativeLanguage && !isValidLanguage(body.nativeLanguage)) {
      throw new AppError(400, "Unsupported native language");
    }
    if (body.level && !isValidLevel(body.level)) {
      throw new AppError(400, "Invalid level");
    }

    const db = getDb();
    const updates: Partial<typeof userSettings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.targetLanguage) updates.targetLanguage = body.targetLanguage;
    if (body.nativeLanguage) updates.nativeLanguage = body.nativeLanguage;
    if (body.level) updates.level = body.level;
    if (body.onboardingCompleted !== undefined) {
      updates.onboardingCompleted = body.onboardingCompleted;
    }
    if (body.dailyGoalMinutes) updates.dailyGoalMinutes = body.dailyGoalMinutes;

    const [updated] = await db
      .update(userSettings)
      .set(updates)
      .where(eq(userSettings.userId, userId))
      .returning();

    if (!updated) {
      throw new AppError(404, "Settings not found");
    }

    res.json(serializeSettings(updated));
  } catch (e) {
    next(e);
  }
});
