-- Additive vocabulary indexes for active (non-deleted) list/due/state queries
-- and weekly review aggregation by user + created_at.
-- Recovery: if apply fails mid-way, inspect which indexes exist and re-run
-- CREATE INDEX IF NOT EXISTS statements only. Do not DROP production data.

CREATE INDEX IF NOT EXISTS "vocabulary_items_user_due_active_idx"
  ON "vocabulary_items" ("user_id", "next_review_at")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vocabulary_items_user_lang_state_active_idx"
  ON "vocabulary_items" ("user_id", "language", "learning_state")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vocabulary_reviews_user_created_idx"
  ON "vocabulary_reviews" ("user_id", "created_at");
