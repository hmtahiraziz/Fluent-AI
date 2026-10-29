import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export type LearningState =
  | "new"
  | "learning"
  | "review"
  | "difficult"
  | "mastered";

export type VocabRating = "again" | "hard" | "good" | "easy";

export type MessageCorrection = {
  original: string;
  corrected: string;
  explanation: string;
  /** Optional idiomatic alternative; must not merely repeat corrected. */
  naturalAlternative?: string | null;
};

export type VocabularySuggestion = {
  term: string;
  meaning: string;
};

export const MOTIVATIONS = [
  "travel",
  "work",
  "school",
  "family",
  "fun",
] as const;
export type Motivation = (typeof MOTIVATIONS)[number];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  targetLanguage: text("target_language").notNull().default("es"),
  nativeLanguage: text("native_language").notNull().default("en"),
  level: text("level").notNull().default("A1"),
  motivation: text("motivation").notNull().default("fun"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(10),
  llmConsentVersion: text("llm_consent_version"),
  llmConsentAt: timestamp("llm_consent_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const PRACTICE_TOPICS = [
  "grammar",
  "culture",
  "business",
  "travel",
] as const;
export type PracticeTopic = (typeof PRACTICE_TOPICS)[number];

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    language: text("language").notNull(),
    level: text("level").notNull(),
    nativeLanguage: text("native_language").notNull().default("en"),
    motivation: text("motivation").notNull().default("fun"),
    topic: text("topic").$type<PracticeTopic | null>(),
    scenario: text("scenario"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("conversations_user_id_idx").on(t.userId),
    index("conversations_user_updated_at_idx").on(t.userId, t.updatedAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    correction: jsonb("correction").$type<MessageCorrection | null>(),
    vocabularySuggestions: jsonb(
      "vocabulary_suggestions",
    ).$type<VocabularySuggestion[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("messages_conversation_id_idx").on(t.conversationId)],
);

export const vocabularyItems = pgTable(
  "vocabulary_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    phrase: text("phrase").notNull(),
    /** lower(trim(collapsed whitespace)) — uniqueness key */
    phraseKey: text("phrase_key").notNull(),
    translation: text("translation"),
    note: text("note"),
    pronunciation: text("pronunciation"),
    exampleSentence: text("example_sentence"),
    sourceMessageId: uuid("source_message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    learningState: text("learning_state")
      .$type<LearningState>()
      .notNull()
      .default("new"),
    easeFactor: real("ease_factor").notNull().default(2.5),
    intervalDays: real("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    reviewVersion: integer("review_version").notNull().default(0),
    lastReviewClientRequestId: uuid("last_review_client_request_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("vocabulary_items_user_id_idx").on(t.userId),
    index("vocabulary_items_user_due_idx").on(t.userId, t.nextReviewAt),
    index("vocabulary_items_user_due_active_idx")
      .on(t.userId, t.nextReviewAt)
      .where(sql`${t.deletedAt} is null`),
    index("vocabulary_items_user_lang_state_active_idx")
      .on(t.userId, t.language, t.learningState)
      .where(sql`${t.deletedAt} is null`),
    uniqueIndex("vocabulary_items_user_lang_phrase_key_uidx").on(
      t.userId,
      t.language,
      t.phraseKey,
    ),
  ],
);

export type VocabularyReviewResponseJson = {
  item: Record<string, unknown>;
  review: {
    id: string;
    rating: VocabRating;
    clientRequestId: string;
    status: "completed";
    createdAt: string;
  };
};

export const vocabularyReviews = pgTable(
  "vocabulary_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vocabularyItemId: uuid("vocabulary_item_id")
      .notNull()
      .references(() => vocabularyItems.id, { onDelete: "cascade" }),
    clientRequestId: uuid("client_request_id").notNull(),
    status: text("status").notNull().default("pending"),
    rating: text("rating").$type<VocabRating>().notNull(),
    baseVersion: integer("base_version").notNull().default(0),
    responseJson: jsonb("response_json").$type<VocabularyReviewResponseJson | null>(),
    easeBefore: real("ease_before"),
    easeAfter: real("ease_after"),
    intervalBefore: real("interval_before"),
    intervalAfter: real("interval_after"),
    scheduledBefore: timestamp("scheduled_before", { withTimezone: true }),
    scheduledAfter: timestamp("scheduled_after", { withTimezone: true }),
    learningStateAfter: text("learning_state_after").$type<LearningState | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("vocabulary_reviews_user_client_req_uidx").on(
      t.userId,
      t.clientRequestId,
    ),
    index("vocabulary_reviews_item_created_idx").on(
      t.vocabularyItemId,
      t.createdAt,
    ),
    index("vocabulary_reviews_user_status_idx").on(t.userId, t.status),
    index("vocabulary_reviews_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const vocabularyItemsDuplicatesArchive = pgTable(
  "vocabulary_items_duplicates_archive",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    language: text("language").notNull(),
    phrase: text("phrase").notNull(),
    translation: text("translation"),
    note: text("note"),
    sourceMessageId: uuid("source_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    mergedIntoId: uuid("merged_into_id").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const chatIdempotencyKeys = pgTable(
  "chat_idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    clientRequestId: uuid("client_request_id").notNull(),
    status: text("status").notNull().default("pending"),
    responseJson: jsonb("response_json"),
    userMessageId: uuid("user_message_id"),
    assistantMessageId: uuid("assistant_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("chat_idempotency_user_convo_req_uidx").on(
      t.userId,
      t.conversationId,
      t.clientRequestId,
    ),
  ],
);

/** purpose: `otp` (HMAC of 6-digit code) | `authorization` (opaque reset token after OTP verify) */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    purpose: text("purpose").notNull().default("otp"),
    attemptCount: integer("attempt_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("password_reset_tokens_hash_idx").on(t.tokenHash),
    index("password_reset_tokens_user_id_idx").on(t.userId),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedByHash: text("replaced_by_hash"),
  },
  (t) => [index("refresh_tokens_user_id_idx").on(t.userId)],
);

export const aiDailyUsage = pgTable(
  "ai_daily_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    usageDate: date("usage_date").notNull(),
    requestCount: integer("request_count").notNull().default(0),
  },
  (t) => [
    uniqueIndex("ai_daily_usage_user_date_uidx").on(t.userId, t.usageDate),
  ],
);

/**
 * Cumulative active practice duration per user local calendar date.
 * Client supplies practice_date as the device local YYYY-MM-DD (not remapped by server TZ).
 * Upserts use GREATEST(existing, submitted) — multi-device does not sum.
 */
export const practiceDailyMinutes = pgTable(
  "practice_daily_minutes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    practiceDate: date("practice_date").notNull(),
    durationMs: integer("duration_ms").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("practice_daily_minutes_user_date_uidx").on(
      t.userId,
      t.practiceDate,
    ),
  ],
);

export const contentReports = pgTable("content_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "set null",
  }),
  messageId: uuid("message_id").references(() => messages.id, {
    onDelete: "set null",
  }),
  reason: text("reason").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
