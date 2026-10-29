-- Vocabulary learning progress, soft-delete, content fields, and review claims.

ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "pronunciation" text;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "example_sentence" text;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "learning_state" text DEFAULT 'new' NOT NULL;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "ease_factor" real DEFAULT 2.5 NOT NULL;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "interval_days" real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "repetitions" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "lapses" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "next_review_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "last_reviewed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "review_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "last_review_client_request_id" uuid;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "vocabulary_items_user_due_idx"
  ON "vocabulary_items" ("user_id", "next_review_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "vocabulary_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vocabulary_item_id" uuid NOT NULL,
	"client_request_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"rating" text NOT NULL,
	"base_version" integer DEFAULT 0 NOT NULL,
	"response_json" jsonb,
	"ease_before" real,
	"ease_after" real,
	"interval_before" real,
	"interval_after" real,
	"scheduled_before" timestamp with time zone,
	"scheduled_after" timestamp with time zone,
	"learning_state_after" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "vocabulary_reviews" ADD CONSTRAINT "vocabulary_reviews_user_id_users_id_fk"
   FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vocabulary_reviews" ADD CONSTRAINT "vocabulary_reviews_vocabulary_item_id_vocabulary_items_id_fk"
   FOREIGN KEY ("vocabulary_item_id") REFERENCES "public"."vocabulary_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "vocabulary_reviews_user_client_req_uidx"
  ON "vocabulary_reviews" ("user_id", "client_request_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vocabulary_reviews_item_created_idx"
  ON "vocabulary_reviews" ("vocabulary_item_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vocabulary_reviews_user_status_idx"
  ON "vocabulary_reviews" ("user_id", "status");
