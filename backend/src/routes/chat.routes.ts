import { Router } from "express";
import { z } from "zod";
import { authMiddleware, getUserId } from "../middleware/auth";
import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
} from "../services/chat.service";

const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.get("/conversations", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const rows = await listConversations(userId);
    res.json({ conversations: rows });
  } catch (e) {
    next(e);
  }
});

chatRouter.post("/conversations", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = createConversationSchema.parse(req.body ?? {});
    const row = await createConversation(userId, body.title);
    res.status(201).json({ conversation: row });
  } catch (e) {
    next(e);
  }
});

chatRouter.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversationId = z.string().uuid().parse(req.params.id);
    const rows = await listMessages(userId, conversationId);
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
    const result = await sendMessage(userId, conversationId, body.content);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});
