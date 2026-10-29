import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "../db";
import {
  conversations,
  messages,
  userSettings,
  vocabularyItems,
  vocabularyReviews,
  type LearningState,
  type VocabularyReviewResponseJson,
} from "../db/schema";
import { AppError } from "../middleware/errorHandler";
import { isValidLanguage } from "../constants/languages";
import { mergeVocabFieldsOntoKeeper, normalizeVocabularyPhrase } from "./vocabularyNormalize";
import {
  VOCAB_SORTS,
  cursorFromItem,
  decodeVocabCursor,
  type VocabSort,
} from "./vocabularyCursor";
import {
  VOCAB_RATINGS,
  applyVocabRating,
  type VocabRating,
} from "./vocabularySrs";
import { buildIlikeContainsPattern } from "./vocabularySearch";

export class VocabHttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public body: Record<string, unknown>,
  ) {
    super(message);
    this.name = "VocabHttpError";
  }
}

function emptyToNull(v: string | undefined | null): string | null | undefined {
  if (v === undefined) return undefined;
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

export function serializeVocabItem(row: typeof vocabularyItems.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    language: row.language,
    phrase: row.phrase,
    phraseKey: row.phraseKey,
    translation: row.translation,
    note: row.note,
    pronunciation: row.pronunciation,
    exampleSentence: row.exampleSentence,
    sourceMessageId: row.sourceMessageId,
    learningState: row.learningState,
    easeFactor: row.easeFactor,
    intervalDays: row.intervalDays,
    repetitions: row.repetitions,
    lapses: row.lapses,
    nextReviewAt: row.nextReviewAt?.toISOString() ?? null,
    lastReviewedAt: row.lastReviewedAt?.toISOString() ?? null,
    reviewVersion: row.reviewVersion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

async function getOwnedItem(userId: string, id: string, opts?: { includeDeleted?: boolean }) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(vocabularyItems)
    .where(
      and(
        eq(vocabularyItems.id, id),
        eq(vocabularyItems.userId, userId),
        opts?.includeDeleted ? undefined : isNull(vocabularyItems.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listVocabulary(input: {
  userId: string;
  language?: string;
  limit: number;
  state?: LearningState;
  sort: VocabSort;
  q?: string;
  cursor?: string;
}) {
  if (input.language && !isValidLanguage(input.language)) {
    throw new AppError(400, "Unsupported language filter");
  }
  if (!(VOCAB_SORTS as readonly string[]).includes(input.sort)) {
    throw new AppError(400, "Invalid sort");
  }

  const db = getDb();
  const conditions: SQL[] = [
    eq(vocabularyItems.userId, input.userId),
    isNull(vocabularyItems.deletedAt),
  ];
  if (input.language) {
    conditions.push(eq(vocabularyItems.language, input.language));
  }
  if (input.state) {
    conditions.push(eq(vocabularyItems.learningState, input.state));
  }
  const searchPattern = input.q ? buildIlikeContainsPattern(input.q) : null;
  if (searchPattern) {
    // ILIKE with ESCAPE '\' so escaped %, _, \ match literally.
    conditions.push(
      or(
        sql`${vocabularyItems.phrase} ILIKE ${searchPattern} ESCAPE '\\'`,
        sql`${vocabularyItems.translation} ILIKE ${searchPattern} ESCAPE '\\'`,
        sql`${vocabularyItems.note} ILIKE ${searchPattern} ESCAPE '\\'`,
      )!,
    );
  }

  if (input.cursor) {
    const c = decodeVocabCursor(input.cursor, input.sort);
    if (input.sort === "created_at") {
      const ca = new Date(c.k!);
      conditions.push(
        or(
          lt(vocabularyItems.createdAt, ca),
          and(eq(vocabularyItems.createdAt, ca), lt(vocabularyItems.id, c.id)),
        )!,
      );
    } else if (input.sort === "phrase") {
      conditions.push(
        or(
          gt(vocabularyItems.phrase, c.k!),
          and(eq(vocabularyItems.phrase, c.k!), gt(vocabularyItems.id, c.id)),
        )!,
      );
    } else if (c.n) {
      conditions.push(
        or(
          and(isNull(vocabularyItems.nextReviewAt), gt(vocabularyItems.id, c.id)),
          isNotNull(vocabularyItems.nextReviewAt),
        )!,
      );
    } else {
      const nr = new Date(c.k!);
      conditions.push(
        and(
          isNotNull(vocabularyItems.nextReviewAt),
          or(
            gt(vocabularyItems.nextReviewAt, nr),
            and(eq(vocabularyItems.nextReviewAt, nr), gt(vocabularyItems.id, c.id)),
          ),
        )!,
      );
    }
  }

  const order =
    input.sort === "created_at"
      ? [desc(vocabularyItems.createdAt), desc(vocabularyItems.id)]
      : input.sort === "phrase"
        ? [asc(vocabularyItems.phrase), asc(vocabularyItems.id)]
        : [
            sql`${vocabularyItems.nextReviewAt} ASC NULLS FIRST`,
            asc(vocabularyItems.id),
          ];

  const rows = await db
    .select()
    .from(vocabularyItems)
    .where(and(...conditions))
    .orderBy(...order)
    .limit(input.limit + 1);

  const page = rows.slice(0, input.limit);
  const nextCursor =
    rows.length > input.limit
      ? cursorFromItem(input.sort, page[page.length - 1]!)
      : null;

  return {
    items: page.map(serializeVocabItem),
    nextCursor,
  };
}

export async function getVocabularyStats(
  userId: string,
  language?: string,
  createdSince?: Date,
) {
  if (language && !isValidLanguage(language)) {
    throw new AppError(400, "Unsupported language filter");
  }
  const db = getDb();
  const conditions: SQL[] = [
    eq(vocabularyItems.userId, userId),
    isNull(vocabularyItems.deletedAt),
  ];
  if (language) conditions.push(eq(vocabularyItems.language, language));

  const rows = await db
    .select({
      learningState: vocabularyItems.learningState,
      count: sql<number>`count(*)::int`,
    })
    .from(vocabularyItems)
    .where(and(...conditions))
    .groupBy(vocabularyItems.learningState);

  const counts: Record<LearningState, number> = {
    new: 0,
    learning: 0,
    review: 0,
    difficult: 0,
    mastered: 0,
  };
  let total = 0;
  for (const r of rows) {
    const state = r.learningState as LearningState;
    counts[state] = Number(r.count) || 0;
    total += counts[state];
  }

  const [dueRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vocabularyItems)
    .where(
      and(
        ...conditions,
        or(
          isNull(vocabularyItems.nextReviewAt),
          sql`${vocabularyItems.nextReviewAt} <= now()`,
        ),
      ),
    );

  let createdToday: number | undefined;
  if (createdSince) {
    const [todayRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vocabularyItems)
      .where(and(...conditions, gte(vocabularyItems.createdAt, createdSince)));
    createdToday = Number(todayRow?.count) || 0;
  }

  return {
    total,
    dueCount: Number(dueRow?.count) || 0,
    byState: counts,
    ...(createdToday != null ? { createdToday } : {}),
  };
}

export async function getVocabularyById(userId: string, id: string) {
  const item = await getOwnedItem(userId, id);
  if (!item) throw new AppError(404, "Vocabulary item not found");

  let source: {
    messageId: string;
    conversationId: string;
    title: string | null;
    excerpt: string;
  } | null = null;

  if (item.sourceMessageId) {
    const db = getDb();
    const [joined] = await db
      .select({
        messageId: messages.id,
        content: messages.content,
        conversationId: conversations.id,
        title: conversations.title,
        conversationUserId: conversations.userId,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(messages.id, item.sourceMessageId))
      .limit(1);

    if (joined && joined.conversationUserId === userId) {
      source = {
        messageId: joined.messageId,
        conversationId: joined.conversationId,
        title: joined.title,
        excerpt: joined.content.slice(0, 280),
      };
    }
  }

  return { item: serializeVocabItem(item), source };
}

export async function createVocabularyItem(
  userId: string,
  body: {
    phrase: string;
    translation?: string;
    note?: string;
    language?: string;
    sourceMessageId?: string;
  },
) {
  const db = getDb();

  let language = body.language;
  if (!language) {
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

  const { phrase, phraseKey } = normalizeVocabularyPhrase(body.phrase);
  if (!phraseKey) throw new AppError(400, "Phrase is required");

  let sourceMessageId: string | null = body.sourceMessageId ?? null;
  if (sourceMessageId) {
    const [msg] = await db
      .select({ id: messages.id, conversationId: messages.conversationId })
      .from(messages)
      .where(eq(messages.id, sourceMessageId))
      .limit(1);
    if (!msg) throw new AppError(400, "Invalid source message");
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
    if (!owned) throw new AppError(400, "Invalid source message");
  }

  const translation = body.translation?.trim() || null;
  const note = body.note?.trim() || null;

  try {
    const [item] = await db
      .insert(vocabularyItems)
      .values({
        userId,
        language,
        phrase,
        phraseKey,
        translation,
        note,
        sourceMessageId,
      })
      .onConflictDoNothing({
        target: [
          vocabularyItems.userId,
          vocabularyItems.language,
          vocabularyItems.phraseKey,
        ],
      })
      .returning();

    if (item) {
      return { item: serializeVocabItem(item), created: true as const };
    }
  } catch {
    // fall through
  }

  const [existing] = await db
    .select()
    .from(vocabularyItems)
    .where(
      and(
        eq(vocabularyItems.userId, userId),
        eq(vocabularyItems.language, language),
        eq(vocabularyItems.phraseKey, phraseKey),
      ),
    )
    .limit(1);

  if (!existing) throw new AppError(500, "Failed to save vocabulary");

  if (existing.deletedAt) {
    const merged = mergeVocabFieldsOntoKeeper(
      {
        translation: existing.translation,
        note: existing.note,
        sourceMessageId: existing.sourceMessageId,
        pronunciation: existing.pronunciation,
        exampleSentence: existing.exampleSentence,
      },
      {
        translation,
        note,
        sourceMessageId,
        pronunciation: null,
        exampleSentence: null,
      },
    );
    const [revived] = await db
      .update(vocabularyItems)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
        translation: merged.translation,
        note: merged.note,
        sourceMessageId: merged.sourceMessageId,
        pronunciation: merged.pronunciation,
        exampleSentence: merged.exampleSentence,
      })
      .where(
        and(
          eq(vocabularyItems.id, existing.id),
          eq(vocabularyItems.userId, userId),
        ),
      )
      .returning();
    if (!revived) throw new AppError(500, "Failed to restore vocabulary");
    return { item: serializeVocabItem(revived), created: false as const };
  }

  return { item: serializeVocabItem(existing), created: false as const };
}

export async function patchVocabularyItem(
  userId: string,
  id: string,
  body: {
    translation?: string | null;
    note?: string | null;
    pronunciation?: string | null;
    exampleSentence?: string | null;
  },
) {
  const updates: Partial<typeof vocabularyItems.$inferInsert> = {
    updatedAt: new Date(),
  };
  if ("translation" in body) updates.translation = emptyToNull(body.translation) ?? null;
  if ("note" in body) updates.note = emptyToNull(body.note) ?? null;
  if ("pronunciation" in body) {
    updates.pronunciation = emptyToNull(body.pronunciation) ?? null;
  }
  if ("exampleSentence" in body) {
    updates.exampleSentence = emptyToNull(body.exampleSentence) ?? null;
  }

  const db = getDb();
  const [item] = await db
    .update(vocabularyItems)
    .set(updates)
    .where(
      and(
        eq(vocabularyItems.id, id),
        eq(vocabularyItems.userId, userId),
        isNull(vocabularyItems.deletedAt),
      ),
    )
    .returning();
  if (!item) throw new AppError(404, "Vocabulary item not found");
  return { item: serializeVocabItem(item) };
}

export async function softDeleteVocabularyItem(userId: string, id: string) {
  const db = getDb();
  const [deleted] = await db
    .update(vocabularyItems)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(vocabularyItems.id, id),
        eq(vocabularyItems.userId, userId),
        isNull(vocabularyItems.deletedAt),
      ),
    )
    .returning({ id: vocabularyItems.id });
  if (!deleted) throw new AppError(404, "Vocabulary item not found");
}

export async function restoreVocabularyItem(userId: string, id: string) {
  const db = getDb();
  const [item] = await db
    .update(vocabularyItems)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(vocabularyItems.id, id),
        eq(vocabularyItems.userId, userId),
        isNotNull(vocabularyItems.deletedAt),
      ),
    )
    .returning();
  if (!item) throw new AppError(404, "Vocabulary item not found");
  return { item: serializeVocabItem(item) };
}

export async function getReviewQueue(input: {
  userId: string;
  language?: string;
  limit: number;
}) {
  if (input.language && !isValidLanguage(input.language)) {
    throw new AppError(400, "Unsupported language filter");
  }
  const db = getDb();
  const conditions: SQL[] = [
    eq(vocabularyItems.userId, input.userId),
    isNull(vocabularyItems.deletedAt),
    or(
      isNull(vocabularyItems.nextReviewAt),
      sql`${vocabularyItems.nextReviewAt} <= now()`,
    )!,
  ];
  if (input.language) {
    conditions.push(eq(vocabularyItems.language, input.language));
  }

  const rows = await db
    .select()
    .from(vocabularyItems)
    .where(and(...conditions))
    .orderBy(
      sql`${vocabularyItems.nextReviewAt} ASC NULLS FIRST`,
      sql`CASE ${vocabularyItems.learningState}
        WHEN 'difficult' THEN 0
        WHEN 'learning' THEN 1
        WHEN 'new' THEN 2
        WHEN 'review' THEN 3
        WHEN 'mastered' THEN 4
        ELSE 5 END`,
      asc(vocabularyItems.id),
    )
    .limit(input.limit);

  return { items: rows.map(serializeVocabItem) };
}

async function findReviewClaim(userId: string, clientRequestId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(vocabularyReviews)
    .where(
      and(
        eq(vocabularyReviews.userId, userId),
        eq(vocabularyReviews.clientRequestId, clientRequestId),
      ),
    )
    .limit(1);
  return row ?? null;
}

function buildReviewResponse(
  item: typeof vocabularyItems.$inferSelect,
  claim: typeof vocabularyReviews.$inferSelect,
): VocabularyReviewResponseJson {
  return {
    item: serializeVocabItem(item),
    review: {
      id: claim.id,
      rating: claim.rating,
      clientRequestId: claim.clientRequestId,
      status: "completed",
      createdAt: claim.createdAt.toISOString(),
    },
  };
}

async function completeClaimFromItem(
  claim: typeof vocabularyReviews.$inferSelect,
  item: typeof vocabularyItems.$inferSelect,
) {
  const db = getDb();
  const response = buildReviewResponse(item, claim);
  const [updated] = await db
    .update(vocabularyReviews)
    .set({
      status: "completed",
      responseJson: response,
      learningStateAfter: item.learningState,
      easeAfter: item.easeFactor,
      intervalAfter: item.intervalDays,
      scheduledAfter: item.nextReviewAt,
      updatedAt: new Date(),
    })
    .where(eq(vocabularyReviews.id, claim.id))
    .returning();
  return (updated?.responseJson as VocabularyReviewResponseJson) ?? response;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function submitVocabularyReview(input: {
  userId: string;
  itemId: string;
  rating: VocabRating;
  clientRequestId: string;
  now?: Date;
}) {
  if (!(VOCAB_RATINGS as readonly string[]).includes(input.rating)) {
    throw new AppError(400, "Invalid rating");
  }

  const now = input.now ?? new Date();
  const db = getDb();

  const existingClaim = await findReviewClaim(
    input.userId,
    input.clientRequestId,
  );
  if (
    existingClaim &&
    existingClaim.vocabularyItemId !== input.itemId
  ) {
    throw new VocabHttpError(409, "Review client request conflict", {
      error: "Review client request conflict",
      code: "REVIEW_CLIENT_REQUEST_CONFLICT",
    });
  }
  if (existingClaim?.status === "completed" && existingClaim.responseJson) {
    return existingClaim.responseJson;
  }

  const item = await getOwnedItem(input.userId, input.itemId);
  if (!item) throw new AppError(404, "Vocabulary item not found");

  let claim = existingClaim;
  if (claim?.status === "failed") {
    const [reset] = await db
      .update(vocabularyReviews)
      .set({
        status: "pending",
        responseJson: null,
        baseVersion: item.reviewVersion,
        rating: input.rating,
        vocabularyItemId: item.id,
        updatedAt: new Date(),
      })
      .where(eq(vocabularyReviews.id, claim.id))
      .returning();
    claim = reset ?? claim;
  } else if (!claim) {
    try {
      const [inserted] = await db
        .insert(vocabularyReviews)
        .values({
          userId: input.userId,
          vocabularyItemId: item.id,
          clientRequestId: input.clientRequestId,
          status: "pending",
          rating: input.rating,
          baseVersion: item.reviewVersion,
        })
        .returning();
      claim = inserted!;
    } catch {
      claim = await findReviewClaim(input.userId, input.clientRequestId);
      if (claim?.status === "completed" && claim.responseJson) {
        return claim.responseJson;
      }
      if (!claim) throw new AppError(500, "Failed to claim review");
    }
  }

  // Pending wait / recovery
  for (let attempt = 0; attempt < 3; attempt++) {
    const fresh = await getOwnedItem(input.userId, input.itemId);
    if (!fresh) {
      await db
        .update(vocabularyReviews)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(vocabularyReviews.id, claim.id));
      throw new AppError(404, "Vocabulary item not found");
    }

    if (fresh.lastReviewClientRequestId === input.clientRequestId) {
      return completeClaimFromItem(claim, fresh);
    }

    const again = await findReviewClaim(input.userId, input.clientRequestId);
    if (again?.status === "completed" && again.responseJson) {
      return again.responseJson;
    }
    if (again && again.status === "pending" && attempt < 2) {
      // Only wait if another worker might be finishing the same claim
      if (again.updatedAt.getTime() > Date.now() - 50 && attempt === 0) {
        await sleep(40);
        continue;
      }
    }
    break;
  }

  const fresh = await getOwnedItem(input.userId, input.itemId);
  if (!fresh) throw new AppError(404, "Vocabulary item not found");

  if (fresh.lastReviewClientRequestId === input.clientRequestId) {
    return completeClaimFromItem(claim, fresh);
  }

  // Align base_version to current for resume when still pending and unstamped
  const baseVersion = fresh.reviewVersion;
  await db
    .update(vocabularyReviews)
    .set({ baseVersion, updatedAt: new Date() })
    .where(
      and(
        eq(vocabularyReviews.id, claim.id),
        eq(vocabularyReviews.status, "pending"),
      ),
    );

  const srs = applyVocabRating(
    {
      learningState: fresh.learningState,
      easeFactor: fresh.easeFactor,
      intervalDays: fresh.intervalDays,
      repetitions: fresh.repetitions,
      lapses: fresh.lapses,
    },
    input.rating,
    now,
  );

  const projected = {
    ...fresh,
    learningState: srs.learningState,
    easeFactor: srs.easeFactor,
    intervalDays: srs.intervalDays,
    repetitions: srs.repetitions,
    lapses: srs.lapses,
    nextReviewAt: srs.nextReviewAt,
    lastReviewedAt: srs.lastReviewedAt,
    lastReviewClientRequestId: input.clientRequestId,
    reviewVersion: fresh.reviewVersion + 1,
    updatedAt: now,
  };
  const response = buildReviewResponse(projected, claim);

  // CAS first — never complete the claim unless the card UPDATE matched.
  // Crash between UPDATE and claim-complete is healed via last_review_client_request_id.
  const [updated] = await db
    .update(vocabularyItems)
    .set({
      learningState: srs.learningState,
      easeFactor: srs.easeFactor,
      intervalDays: srs.intervalDays,
      repetitions: srs.repetitions,
      lapses: srs.lapses,
      nextReviewAt: srs.nextReviewAt,
      lastReviewedAt: srs.lastReviewedAt,
      lastReviewClientRequestId: input.clientRequestId,
      reviewVersion: fresh.reviewVersion + 1,
      updatedAt: now,
    })
    .where(
      and(
        eq(vocabularyItems.id, fresh.id),
        eq(vocabularyItems.userId, input.userId),
        isNull(vocabularyItems.deletedAt),
        eq(vocabularyItems.reviewVersion, baseVersion),
        sql`${vocabularyItems.lastReviewClientRequestId} IS DISTINCT FROM ${input.clientRequestId}`,
      ),
    )
    .returning();

  if (!updated) {
    const latest = await getOwnedItem(input.userId, input.itemId);
    if (latest?.lastReviewClientRequestId === input.clientRequestId) {
      return completeClaimFromItem(claim, latest);
    }
    await db
      .update(vocabularyReviews)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(vocabularyReviews.id, claim.id));
    throw new VocabHttpError(409, "Review conflict", {
      error: "Review conflict",
      code: "REVIEW_VERSION_CONFLICT",
      item: latest ? serializeVocabItem(latest) : null,
    });
  }

  const finalResponse: VocabularyReviewResponseJson = {
    ...response,
    item: serializeVocabItem(updated),
  };

  await db
    .update(vocabularyReviews)
    .set({
      status: "completed",
      responseJson: finalResponse,
      easeBefore: fresh.easeFactor,
      easeAfter: srs.easeFactor,
      intervalBefore: fresh.intervalDays,
      intervalAfter: srs.intervalDays,
      scheduledBefore: fresh.nextReviewAt,
      scheduledAfter: srs.nextReviewAt,
      learningStateAfter: srs.learningState,
      updatedAt: new Date(),
    })
    .where(eq(vocabularyReviews.id, claim.id));

  return finalResponse;
}
