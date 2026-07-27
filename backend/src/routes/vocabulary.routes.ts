import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { isValidLanguage } from "../constants/languages";
import { getDb } from "../db";
import { vocabularyItems } from "../db/schema";
import { authMiddleware, getUserId } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const createSchema = z.object({
  phrase: z.string().min(1).max(500),
  translation: z.string().max(500).optional(),
  note: z.string().max(2000).optional(),
  language: z.string().min(2).max(5).optional(),
  sourceMessageId: z.string().uuid().optional(),
});

export const vocabularyRouter = Router();

vocabularyRouter.use(authMiddleware);

vocabularyRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;

    if (language && !isValidLanguage(language)) {
      throw new AppError(400, "Unsupported language filter");
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(vocabularyItems)
      .where(
        language
          ? and(
              eq(vocabularyItems.userId, userId),
              eq(vocabularyItems.language, language),
            )
          : eq(vocabularyItems.userId, userId),
      )
      .orderBy(desc(vocabularyItems.createdAt));

    res.json({ items: rows });
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = createSchema.parse(req.body);
    const db = getDb();

    let language = body.language;
    if (!language) {
      const { userSettings } = await import("../db/schema");
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      language = settings?.targetLanguage ?? "es";
    }

    if (!isValidLanguage(language)) {
      throw new AppError(400, "Unsupported language");
    }

    const [item] = await db
      .insert(vocabularyItems)
      .values({
        userId,
        language,
        phrase: body.phrase.trim(),
        translation: body.translation?.trim() || null,
        note: body.note?.trim() || null,
        sourceMessageId: body.sourceMessageId ?? null,
      })
      .returning();

    if (!item) throw new AppError(500, "Failed to save vocabulary");
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = z.string().uuid().parse(req.params.id);
    const db = getDb();

    const [deleted] = await db
      .delete(vocabularyItems)
      .where(
        and(eq(vocabularyItems.id, id), eq(vocabularyItems.userId, userId)),
      )
      .returning({ id: vocabularyItems.id });

    if (!deleted) {
      throw new AppError(404, "Vocabulary item not found");
    }

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
