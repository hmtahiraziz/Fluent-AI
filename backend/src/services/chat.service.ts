import { and, asc, desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import { z } from "zod";
import { getEnv } from "../config/env";
import type { CefrLevel } from "../constants/languages";
import { getDb } from "../db";
import {
  conversations,
  messages,
  userSettings,
  type MessageCorrection,
} from "../db/schema";
import { AppError } from "../middleware/errorHandler";
import {
  buildTutorSystemPrompt,
  tutorResponseJsonSchema,
} from "./prompts";

const tutorResponseSchema = z.object({
  tutorReply: z.string().min(1),
  correction: z
    .object({
      original: z.string(),
      corrected: z.string(),
      explanation: z.string(),
    })
    .nullable(),
});

const HISTORY_LIMIT = 20;

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });
}

async function callTutorModel(
  language: string,
  level: CefrLevel,
  history: { role: "user" | "assistant"; content: string }[],
  userContent: string,
): Promise<z.infer<typeof tutorResponseSchema>> {
  const client = getOpenAI();
  const model = getEnv().OPENAI_MODEL;

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildTutorSystemPrompt(language, level) },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userContent },
  ];

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: chatMessages,
        response_format: {
          type: "json_schema",
          json_schema: tutorResponseJsonSchema,
        },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new AppError(502, "Empty response from language model");

      return tutorResponseSchema.parse(JSON.parse(raw));
    } catch (e) {
      lastError = e;
    }
  }
  console.error("OpenAI tutor call failed:", lastError);
  throw new AppError(502, "Failed to generate tutor response");
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string,
) {
  const db = getDb();
  const trimmed = content.trim();
  if (!trimmed) {
    throw new AppError(400, "Message content is required");
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .limit(1);

  if (!conversation) {
    throw new AppError(404, "Conversation not found");
  }

  const level = conversation.level as CefrLevel;
  const language = conversation.language;

  const priorRows = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  const history = priorRows
    .slice(-HISTORY_LIMIT)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const [userMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "user",
      content: trimmed,
      correction: null,
    })
    .returning();

  if (!userMessage) {
    throw new AppError(500, "Failed to save message");
  }

  const tutor = await callTutorModel(language, level, history, trimmed);

  const correction: MessageCorrection | null = tutor.correction;
  if (correction) {
    await db
      .update(messages)
      .set({ correction })
      .where(eq(messages.id, userMessage.id));
  }

  const [assistantMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "assistant",
      content: tutor.tutorReply,
      correction: null,
    })
    .returning();

  if (!assistantMessage) {
    throw new AppError(500, "Failed to save tutor reply");
  }

  return {
    userMessage: correction ? { ...userMessage, correction } : userMessage,
    assistantMessage,
    correction,
  };
}

export async function listConversations(userId: string) {
  return getDb()
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt));
}

export async function createConversation(userId: string, title?: string) {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!settings) {
    throw new AppError(400, "User settings not found");
  }

  const [row] = await db
    .insert(conversations)
    .values({
      userId,
      title: title?.trim() || null,
      language: settings.targetLanguage,
      level: settings.level,
    })
    .returning();

  if (!row) throw new AppError(500, "Failed to create conversation");
  return row;
}

export async function listMessages(userId: string, conversationId: string) {
  const db = getDb();
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .limit(1);

  if (!conversation) {
    throw new AppError(404, "Conversation not found");
  }

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}
