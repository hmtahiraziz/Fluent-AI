import { Router } from "express";
import { z } from "zod";
import { authMiddleware, getUserId } from "../middleware/auth";
import {
  getWeeklyProgress,
  upsertPracticeDaily,
} from "../services/progress.service";

const practiceDailySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
});

const weeklyQuerySchema = z.object({
  timeZone: z.string().min(1).max(100),
});

export const progressRouter = Router();

progressRouter.use(authMiddleware);

progressRouter.put("/practice-daily", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = practiceDailySchema.parse(req.body);
    const result = await upsertPracticeDaily({
      userId,
      date: body.date,
      durationMs: body.durationMs,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

progressRouter.get("/weekly", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const query = weeklyQuerySchema.parse({
      timeZone:
        typeof req.query.timeZone === "string" ? req.query.timeZone : undefined,
    });
    const result = await getWeeklyProgress(userId, query.timeZone);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
