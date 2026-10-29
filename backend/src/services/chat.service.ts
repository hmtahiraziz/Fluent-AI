import { and, desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import { z } from "zod";
import { getEnv } from "../config/env";
import type { CefrLevel } from "../constants/languages";
import { getDb } from "../db";
import {
  chatIdempotencyKeys,
  conversations,
  messages,
  userSettings,
  type MessageCorrection,
  type VocabularySuggestion,
} from "../db/schema";
import { AppError } from "../middleware/errorHandler";
import { consumeAiQuota } from "./aiQuota.service";
import {
  clampHistoryLimit,
  selectChronologicalHistory,
} from "./chatHistory";
import {
  assertSafeForTutor,
  assertSafeTutorReply,
} from "./moderation.service";
import {
  buildTutorSystemPrompt,
  isPracticeTopic,
  tutorResponseJsonSchema,
  type PracticeTopic,
} from "./prompts";
import { LLM_CONSENT_VERSION } from "./settings.service";

export type CreateConversationInput = {
  title?: string;
  topic?: PracticeTopic;
  scenario?: string;
};

const SUGGESTION_CAP = 3;

function normalizeNaturalAlternative(
  corrected: string,
  alternative: string | null | undefined,
): string | null {
  const trimmed = alternative?.trim() || "";
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === corrected.trim().toLowerCase()) return null;
  return trimmed;
}

function normalizeCorrection(
  raw: {
    original: string;
    corrected: string;
    explanation: string;
    naturalAlternative?: string | null;
  } | null,
): MessageCorrection | null {
  if (!raw) return null;
  const original = raw.original.trim();
  const corrected = raw.corrected.trim();
  const explanation = raw.explanation.trim();
  if (!original || !corrected || !explanation) return null;
  return {
    original,
    corrected,
    explanation,
    naturalAlternative: normalizeNaturalAlternative(
      corrected,
      raw.naturalAlternative,
    ),
  };
}

const tutorResponseSchema = z.object({
  reply: z.string().min(1),
  correction: z
    .object({
      original: z.string(),
      corrected: z.string(),
      explanation: z.string(),
      naturalAlternative: z.string().nullable().optional(),
    })
    .nullable()
    .transform((c) => normalizeCorrection(c)),
  vocabularySuggestions: z
    .array(
      z.object({
        term: z.string().min(1),
        meaning: z.string().min(1),
      }),
    )
    .default([]),
});

const LIST_CAP = 100;
const MESSAGE_LIST_CAP = 200;

export type SendMessageResult = {
  userMessage: typeof messages.$inferSelect;
  assistantMessage: typeof messages.$inferSelect;
  correction: MessageCorrection | null;
  vocabularySuggestions: VocabularySuggestion[];
};

function getOpenAI(): OpenAI {
  const env = getEnv();
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: env.OPENAI_TIMEOUT_MS,
    maxRetries: 0,
  });
}

function mapOpenAiError(e: unknown): AppError | null {
  if (!e || typeof e !== "object") return null;
  const err = e as {
    status?: number;
    code?: string;
    name?: string;
    message?: string;
  };
  if (err.name === "AbortError" || err.code === "ABORT_ERR") {
    return new AppError(499, "Client disconnected");
  }
  if (
    err.code === "ETIMEDOUT" ||
    err.code === "ENOTFOUND" ||
    /timeout/i.test(err.message ?? "")
  ) {
    return new AppError(504, "Language model timed out. Please try again.");
  }
  if (err.status === 429) {
    return new AppError(429, "AI provider rate limit exceeded. Try again shortly.");
  }
  if (err.status === 401 || err.status === 403) {
    return new AppError(502, "Language model authentication failed");
  }
  return null;
}

async function callTutorModel(input: {
  language: string;
  level: CefrLevel;
  nativeLanguage?: string;
  motivation: string;
  topic?: PracticeTopic | null;
  scenario?: string | null;
  history: { role: "user" | "assistant"; content: string }[];
  userContent: string;
  signal?: AbortSignal;
}): Promise<z.infer<typeof tutorResponseSchema>> {
  const client = getOpenAI();
  const env = getEnv();

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildTutorSystemPrompt({
        language: input.language,
        level: input.level,
        nativeLanguage: input.nativeLanguage,
        motivation: input.motivation,
        topic: input.topic,
        scenario: input.scenario,
      }),
    },
    ...input.history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: input.userContent },
  ];

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (input.signal?.aborted) {
      throw new AppError(499, "Client disconnected");
    }
    try {
      const completion = await client.chat.completions.create(
        {
          model: env.OPENAI_MODEL,
          messages: chatMessages,
          max_tokens: env.OPENAI_MAX_TOKENS,
          response_format: {
            type: "json_schema",
            json_schema: tutorResponseJsonSchema,
          },
        },
        { signal: input.signal },
      );

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new AppError(502, "Empty response from language model");

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new AppError(502, "Malformed response from language model");
      }

      const result = tutorResponseSchema.safeParse(parsed);
      if (!result.success) {
        throw new AppError(502, "Invalid tutor response shape");
      }
      return {
        ...result.data,
        vocabularySuggestions: result.data.vocabularySuggestions.slice(
          0,
          SUGGESTION_CAP,
        ),
      };
    } catch (e) {
      if (e instanceof AppError) throw e;
      const mapped = mapOpenAiError(e);
      if (mapped) throw mapped;
      lastError = e;
    }
  }
  // Do not log prompt/reply content.
  console.error(
    "OpenAI tutor call failed:",
    (lastError as Error)?.name ?? "error",
  );
  throw new AppError(502, "Failed to generate tutor response");
}

async function loadRecentHistory(conversationId: string, limit: number) {
  const db = getDb();
  const newestFirst = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit);

  return selectChronologicalHistory(newestFirst, limit);
}

async function findIdempotencyRow(
  userId: string,
  conversationId: string,
  clientRequestId: string,
) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(chatIdempotencyKeys)
    .where(
      and(
        eq(chatIdempotencyKeys.userId, userId),
        eq(chatIdempotencyKeys.conversationId, conversationId),
        eq(chatIdempotencyKeys.clientRequestId, clientRequestId),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function claimIdempotencyKey(
  userId: string,
  conversationId: string,
  clientRequestId: string,
): Promise<"claimed" | "completed" | "pending" | SendMessageResult> {
  const existing = await findIdempotencyRow(
    userId,
    conversationId,
    clientRequestId,
  );
  if (existing?.status === "completed" && existing.responseJson) {
    return existing.responseJson as SendMessageResult;
  }
  if (existing?.status === "pending") {
    return "pending";
  }

  const db = getDb();
  if (existing?.status === "failed") {
    await db
      .update(chatIdempotencyKeys)
      .set({ status: "pending", updatedAt: new Date(), responseJson: null })
      .where(eq(chatIdempotencyKeys.id, existing.id));
    return "claimed";
  }

  try {
    await db.insert(chatIdempotencyKeys).values({
      userId,
      conversationId,
      clientRequestId,
      status: "pending",
    });
    return "claimed";
  } catch {
    const again = await findIdempotencyRow(
      userId,
      conversationId,
      clientRequestId,
    );
    if (again?.status === "completed" && again.responseJson) {
      return again.responseJson as SendMessageResult;
    }
    return "pending";
  }
}

async function markIdempotencyFailed(
  userId: string,
  conversationId: string,
  clientRequestId: string,
) {
  const db = getDb();
  await db
    .update(chatIdempotencyKeys)
    .set({ status: "failed", updatedAt: new Date() })
    .where(
      and(
        eq(chatIdempotencyKeys.userId, userId),
        eq(chatIdempotencyKeys.conversationId, conversationId),
        eq(chatIdempotencyKeys.clientRequestId, clientRequestId),
      ),
    );
}

async function persistTurnAtomic(input: {
  userId: string;
  conversationId: string;
  clientRequestId: string | undefined;
  content: string;
  correction: MessageCorrection | null;
  reply: string;
  vocabularySuggestions: VocabularySuggestion[];
}): Promise<SendMessageResult> {
  const db = getDb();

  // Neon HTTP: use batch for multi-statement atomicity (no interactive TX).
  const userInsert = db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      role: "user",
      content: input.content,
      correction: input.correction,
      vocabularySuggestions: null,
    })
    .returning();

  const assistantInsert = db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      role: "assistant",
      content: input.reply,
      correction: null,
      vocabularySuggestions: input.vocabularySuggestions,
    })
    .returning();

  const batchResult = await db.batch([userInsert, assistantInsert]);
  const userMessage = batchResult[0]?.[0];
  const assistantMessage = batchResult[1]?.[0];

  if (!userMessage || !assistantMessage) {
    throw new AppError(500, "Failed to save messages");
  }

  // Activity stamp for Home "Resume Chat" (latest activity, not creation).
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, input.conversationId));

  const result: SendMessageResult = {
    userMessage,
    assistantMessage,
    correction: input.correction,
    vocabularySuggestions: input.vocabularySuggestions,
  };

  if (input.clientRequestId) {
    await db
      .update(chatIdempotencyKeys)
      .set({
        status: "completed",
        responseJson: result,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(chatIdempotencyKeys.userId, input.userId),
          eq(chatIdempotencyKeys.conversationId, input.conversationId),
          eq(chatIdempotencyKeys.clientRequestId, input.clientRequestId),
        ),
      );
  }

  return result;
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string,
  signal?: AbortSignal,
  clientRequestId?: string,
): Promise<SendMessageResult> {
  const db = getDb();
  const trimmed = content.trim();
  if (!trimmed) {
    throw new AppError(400, "Message content is required");
  }

  const [settings] = await db
    .select({
      llmConsentVersion: userSettings.llmConsentVersion,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (settings?.llmConsentVersion !== LLM_CONSENT_VERSION) {
    throw new AppError(
      403,
      "Please accept AI tutoring consent before sending messages",
    );
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

  if (clientRequestId) {
    const claim = await claimIdempotencyKey(
      userId,
      conversationId,
      clientRequestId,
    );
    if (typeof claim === "object") {
      return claim;
    }
    if (claim === "pending") {
      // Brief poll for in-flight twin
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const row = await findIdempotencyRow(
          userId,
          conversationId,
          clientRequestId,
        );
        if (row?.status === "completed" && row.responseJson) {
          return row.responseJson as SendMessageResult;
        }
        if (row?.status === "failed") break;
      }
      const again = await findIdempotencyRow(
        userId,
        conversationId,
        clientRequestId,
      );
      if (again?.status === "completed" && again.responseJson) {
        return again.responseJson as SendMessageResult;
      }
      if (again?.status === "failed") {
        // Allow this caller to reclaim
        await db
          .update(chatIdempotencyKeys)
          .set({ status: "pending", updatedAt: new Date() })
          .where(eq(chatIdempotencyKeys.id, again.id));
      } else {
        throw new AppError(409, "Request in progress. Retry shortly.");
      }
    }
  }

  try {
    await consumeAiQuota(userId);
    await assertSafeForTutor(trimmed, signal);

    // Use conversation snapshot only — never live settings (existing threads keep saved languages).
    const level = conversation.level as CefrLevel;
    const language = conversation.language;
    const nativeLanguage = conversation.nativeLanguage?.trim() || undefined;
    const motivation = conversation.motivation?.trim() || "fun";
    const topic =
      conversation.topic && isPracticeTopic(conversation.topic)
        ? conversation.topic
        : null;
    const scenario = conversation.scenario?.trim() || null;
    const historyLimit = clampHistoryLimit(getEnv().CHAT_HISTORY_LIMIT);
    const history = await loadRecentHistory(conversationId, historyLimit);

    const tutor = await callTutorModel({
      language,
      level,
      nativeLanguage,
      motivation,
      topic,
      scenario,
      history,
      userContent: trimmed,
      signal,
    });

    await assertSafeTutorReply(tutor.reply, signal);

    const correction: MessageCorrection | null = tutor.correction;
    const vocabularySuggestions: VocabularySuggestion[] =
      tutor.vocabularySuggestions;

    return await persistTurnAtomic({
      userId,
      conversationId,
      clientRequestId,
      content: trimmed,
      correction,
      reply: tutor.reply,
      vocabularySuggestions,
    });
  } catch (e) {
    if (clientRequestId) {
      try {
        await markIdempotencyFailed(userId, conversationId, clientRequestId);
      } catch {
        // ignore secondary failure
      }
    }
    throw e;
  }
}

export async function listConversations(userId: string, limit = 50) {
  const capped = Math.min(Math.max(limit, 1), LIST_CAP);
  return getDb()
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt), desc(conversations.id))
    .limit(capped);
}

export async function createConversation(
  userId: string,
  input: CreateConversationInput = {},
) {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!settings) {
    throw new AppError(400, "User settings not found");
  }

  const now = new Date();
  const [row] = await db
    .insert(conversations)
    .values({
      userId,
      title: input.title?.trim() || null,
      language: settings.targetLanguage,
      level: settings.level,
      nativeLanguage: settings.nativeLanguage,
      motivation: settings.motivation ?? "fun",
      topic: input.topic ?? null,
      scenario: input.scenario?.trim() || null,
      updatedAt: now,
    })
    .returning();

  if (!row) throw new AppError(500, "Failed to create conversation");
  return row;
}

export async function listMessages(
  userId: string,
  conversationId: string,
  limit = 100,
) {
  const db = getDb();
  const capped = Math.min(Math.max(limit, 1), MESSAGE_LIST_CAP);
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

  // Newest window first, then chronological ASC for the client (fixes oldest-N truncation).
  const newestFirst = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(capped);
  return [...newestFirst].reverse();
}

/** Exported for tests */
export { tutorResponseSchema, mapOpenAiError };
