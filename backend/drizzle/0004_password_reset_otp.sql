ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "purpose" text DEFAULT 'otp' NOT NULL;
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "attempt_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "consumed_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" ("user_id");
