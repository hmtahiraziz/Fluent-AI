ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "native_language" text DEFAULT 'en' NOT NULL;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean DEFAULT false NOT NULL;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "daily_goal_minutes" integer DEFAULT 10 NOT NULL;
