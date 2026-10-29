-- Home practice: conversation topic/scenario + activity ordering via updated_at.

ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "topic" text;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "scenario" text;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;
--> statement-breakpoint

UPDATE "conversations"
SET "updated_at" = COALESCE("updated_at", "created_at", now())
WHERE "updated_at" IS NULL;
--> statement-breakpoint

ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET NOT NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "conversations_user_updated_at_idx"
  ON "conversations" ("user_id", "updated_at" DESC);
