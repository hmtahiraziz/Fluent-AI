import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { contentReports, conversations, messages } from "../db/schema";
import { authMiddleware, getUserId } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const reportSchema = z.object({
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  reason: z.enum([
    "inappropriate",
    "harmful",
    "incorrect",
    "spam",
    "other",
  ]),
  details: z.string().max(2000).optional(),
});

export const reportsRouter = Router();

reportsRouter.use(authMiddleware);

reportsRouter.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = reportSchema.parse(req.body);
    const db = getDb();

    if (body.conversationId) {
      const [owned] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          and(
            eq(conversations.id, body.conversationId),
            eq(conversations.userId, userId),
          ),
        )
        .limit(1);
      if (!owned) throw new AppError(404, "Conversation not found");
    }

    if (body.messageId) {
      const [msg] = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
        })
        .from(messages)
        .where(eq(messages.id, body.messageId))
        .limit(1);
      if (!msg) throw new AppError(404, "Message not found");

      const [owned] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          and(
            eq(conversations.id, msg.conversationId),
            eq(conversations.userId, userId),
          ),
        )
        .limit(1);
      if (!owned) throw new AppError(404, "Message not found");
    }

    const [row] = await db
      .insert(contentReports)
      .values({
        userId,
        conversationId: body.conversationId ?? null,
        messageId: body.messageId ?? null,
        reason: body.reason,
        details: body.details?.trim() || null,
      })
      .returning({ id: contentReports.id });

    res.status(201).json({ report: row });
  } catch (e) {
    next(e);
  }
});
