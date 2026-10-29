-- Additive practice-duration table for weekly progress sync.
-- Recovery: CREATE TABLE IF NOT EXISTS is idempotent. Do not DROP if apply fails
-- on a data-bearing environment — inspect and forward-repair instead.

CREATE TABLE IF NOT EXISTS "practice_daily_minutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"practice_date" date NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_daily_minutes" ADD CONSTRAINT "practice_daily_minutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "practice_daily_minutes_user_date_uidx"
  ON "practice_daily_minutes" ("user_id", "practice_date");
