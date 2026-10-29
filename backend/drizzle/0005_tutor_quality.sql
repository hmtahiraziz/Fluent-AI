-- Tutor quality: motivation, conversation snapshots, vocabulary suggestions,
-- chat idempotency, and safe vocabulary de-duplication (archive before unique index).

ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "motivation" text DEFAULT 'fun' NOT NULL;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "native_language" text DEFAULT 'en' NOT NULL;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "motivation" text DEFAULT 'fun' NOT NULL;
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "vocabulary_suggestions" jsonb;
--> statement-breakpoint

-- Backfill conversation snapshots from current user settings where available
UPDATE "conversations" AS c
SET
  "native_language" = COALESCE(s."native_language", c."native_language", 'en'),
  "motivation" = COALESCE(s."motivation", c."motivation", 'fun')
FROM "user_settings" AS s
WHERE s."user_id" = c."user_id";
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "chat_idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"client_request_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"response_json" jsonb,
	"user_message_id" uuid,
	"assistant_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chat_idempotency_user_convo_req_uidx"
  ON "chat_idempotency_keys" ("user_id", "conversation_id", "client_request_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_idempotency_keys" ADD CONSTRAINT "chat_idempotency_keys_user_id_users_id_fk"
   FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_idempotency_keys" ADD CONSTRAINT "chat_idempotency_keys_conversation_id_conversations_id_fk"
   FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- Safe vocabulary de-dupe: archive losers, merge null fields onto keeper, then unique index.
CREATE TABLE IF NOT EXISTS "vocabulary_items_duplicates_archive" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"language" text NOT NULL,
	"phrase" text NOT NULL,
	"translation" text,
	"note" text,
	"source_message_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"merged_into_id" uuid NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "phrase_key" text;
--> statement-breakpoint
UPDATE "vocabulary_items"
SET "phrase_key" = lower(trim(regexp_replace(coalesce("phrase", ''), '\s+', ' ', 'g')))
WHERE "phrase_key" IS NULL;
--> statement-breakpoint
UPDATE "vocabulary_items" SET "phrase" = trim(regexp_replace(coalesce("phrase", ''), '\s+', ' ', 'g'));
--> statement-breakpoint

-- Merge null fields onto keeper (earliest created_at, then lowest id), archive and delete duplicates
DO $$
DECLARE
  r RECORD;
  keeper_id uuid;
  loser RECORD;
BEGIN
  FOR r IN
    SELECT user_id, language, phrase_key
    FROM vocabulary_items
    WHERE phrase_key IS NOT NULL AND phrase_key <> ''
    GROUP BY user_id, language, phrase_key
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keeper_id
    FROM vocabulary_items
    WHERE user_id = r.user_id AND language = r.language AND phrase_key = r.phrase_key
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    FOR loser IN
      SELECT *
      FROM vocabulary_items
      WHERE user_id = r.user_id
        AND language = r.language
        AND phrase_key = r.phrase_key
        AND id <> keeper_id
      ORDER BY created_at ASC, id ASC
    LOOP
      UPDATE vocabulary_items AS k
      SET
        translation = COALESCE(k.translation, loser.translation),
        note = COALESCE(k.note, loser.note),
        source_message_id = COALESCE(k.source_message_id, loser.source_message_id)
      WHERE k.id = keeper_id;

      INSERT INTO vocabulary_items_duplicates_archive (
        id, user_id, language, phrase, translation, note, source_message_id, created_at, merged_into_id
      ) VALUES (
        loser.id, loser.user_id, loser.language, loser.phrase, loser.translation,
        loser.note, loser.source_message_id, loser.created_at, keeper_id
      )
      ON CONFLICT (id) DO NOTHING;

      DELETE FROM vocabulary_items WHERE id = loser.id;
    END LOOP;
  END LOOP;
END $$;
--> statement-breakpoint

-- Drop empty-key rows that cannot participate in uniqueness (should not exist after normalize)
UPDATE "vocabulary_items" SET "phrase_key" = lower(trim(regexp_replace(coalesce("phrase", ''), '\s+', ' ', 'g')))
WHERE "phrase_key" IS NULL OR "phrase_key" = '';
--> statement-breakpoint
ALTER TABLE "vocabulary_items" ALTER COLUMN "phrase_key" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vocabulary_items_user_lang_phrase_key_uidx"
  ON "vocabulary_items" ("user_id", "language", "phrase_key");
