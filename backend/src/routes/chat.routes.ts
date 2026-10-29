import { Router } from "express";
import { z } from "zod";
import { authMiddleware, getUserId } from "../middleware/auth";
import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
} from "../services/chat.service";
import { PRACTICE_TOPICS } from "../services/prompts";

const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
  topic: z.enum(PRACTICE_TOPICS).optional(),
  scenario: z.string().trim().min(1).max(120).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  clientRequestId: z.string().uuid().optional(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.get("/conversations", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { limit } = paginationSchema.parse(req.query);
    const rows = await listConversations(userId, limit ?? 50);
    res.json({ conversations: rows });
  } catch (e) {
    next(e);
  }
});

chatRouter.post("/conversations", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = createConversationSchema.parse(req.body ?? {});
    const row = await createConversation(userId, {
      title: body.title,
      topic: body.topic,
      scenario: body.scenario,
    });
    res.status(201).json({ conversation: row });
  } catch (e) {
    next(e);
  }
});

chatRouter.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversationId = z.string().uuid().parse(req.params.id);
    const { limit } = paginationSchema.parse(req.query);
    const rows = await listMessages(userId, conversationId, limit ?? 100);
    res.json({ messages: rows });
  } catch (e) {
    next(e);
  }
});

chatRouter.post("/conversations/:id/messages", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversationId = z.string().uuid().parse(req.params.id);
    const body = sendMessageSchema.parse(req.body);

    const ac = new AbortController();
    const onClose = () => ac.abort();
    req.on("close", onClose);

    try {
      const result = await sendMessage(
        userId,
        conversationId,
        body.content,
        ac.signal,
        body.clientRequestId,
      );
      // Idempotent replays still return the same envelope (200 vs 201 is optional;
      // keep 201 for create semantics when messages were just written — clients ignore status).
      res.status(201).json(result);
    } finally {
      req.off("close", onClose);
    }
  } catch (e) {
    next(e);
  }
});
