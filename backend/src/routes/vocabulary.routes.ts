import { Router } from "express";
import { z } from "zod";
import { authMiddleware, getUserId } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { LEARNING_STATES } from "../services/vocabularySrs";
import { VOCAB_SORTS } from "../services/vocabularyCursor";
import {
  VocabHttpError,
  createVocabularyItem,
  getReviewQueue,
  getVocabularyById,
  getVocabularyStats,
  listVocabulary,
  patchVocabularyItem,
  restoreVocabularyItem,
  softDeleteVocabularyItem,
  submitVocabularyReview,
} from "../services/vocabulary.service";
import { VOCAB_RATINGS } from "../services/vocabularySrs";

const createSchema = z.object({
  phrase: z.string().min(1).max(500),
  translation: z.string().max(500).optional(),
  note: z.string().max(2000).optional(),
  language: z.string().min(2).max(5).optional(),
  sourceMessageId: z.string().uuid().optional(),
});

const listQuerySchema = z.object({
  language: z.string().min(2).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  state: z.enum(LEARNING_STATES).optional(),
  sort: z.enum(VOCAB_SORTS).optional(),
  q: z.string().max(200).optional(),
  cursor: z.string().max(2000).optional(),
});

const patchSchema = z.object({
  translation: z.string().max(500).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  pronunciation: z.string().max(500).nullable().optional(),
  exampleSentence: z.string().max(2000).nullable().optional(),
});

const reviewSchema = z.object({
  rating: z.enum(VOCAB_RATINGS),
  clientRequestId: z.string().uuid(),
});

const queueQuerySchema = z.object({
  language: z.string().min(2).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const vocabularyRouter = Router();

vocabularyRouter.use(authMiddleware);

vocabularyRouter.get("/stats", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const language =
      typeof req.query.language === "string" ? req.query.language : undefined;
    const createdSinceRaw =
      typeof req.query.createdSince === "string"
        ? req.query.createdSince
        : undefined;
    let createdSince: Date | undefined;
    if (createdSinceRaw) {
      createdSince = new Date(createdSinceRaw);
      if (Number.isNaN(createdSince.getTime())) {
        throw new AppError(400, "Invalid createdSince datetime");
      }
    }
    const stats = await getVocabularyStats(userId, language, createdSince);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.get("/review-queue", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const query = queueQuerySchema.parse(req.query);
    const result = await getReviewQueue({
      userId,
      language: query.language,
      limit: query.limit ?? 20,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const query = listQuerySchema.parse(req.query);
    const result = await listVocabulary({
      userId,
      language: query.language,
      limit: query.limit ?? 100,
      state: query.state,
      sort: query.sort ?? "created_at",
      q: query.q,
      cursor: query.cursor,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = createSchema.parse(req.body);
    const result = await createVocabularyItem(userId, body);
    res.status(result.created ? 201 : 200).json(result);
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.get("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = z.string().uuid().parse(req.params.id);
    const result = await getVocabularyById(userId, id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = z.string().uuid().parse(req.params.id);
    const body = patchSchema.parse(req.body);
    if (Object.keys(body).length === 0) {
      throw new AppError(400, "No fields to update");
    }
    const result = await patchVocabularyItem(userId, id, body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = z.string().uuid().parse(req.params.id);
    await softDeleteVocabularyItem(userId, id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.post("/:id/restore", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = z.string().uuid().parse(req.params.id);
    const result = await restoreVocabularyItem(userId, id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

vocabularyRouter.post("/:id/review", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = z.string().uuid().parse(req.params.id);
    const body = reviewSchema.parse(req.body);
    const result = await submitVocabularyReview({
      userId,
      itemId: id,
      rating: body.rating,
      clientRequestId: body.clientRequestId,
    });
    res.json(result);
  } catch (e) {
    if (e instanceof VocabHttpError) {
      res.status(e.statusCode).json(e.body);
      return;
    }
    next(e);
  }
});
