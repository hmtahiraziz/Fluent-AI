import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Applying additive 0008/0009 statements…");

  await sql`
    CREATE INDEX IF NOT EXISTS "vocabulary_items_user_due_active_idx"
    ON "vocabulary_items" ("user_id", "next_review_at")
    WHERE "deleted_at" IS NULL
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "vocabulary_items_user_lang_state_active_idx"
    ON "vocabulary_items" ("user_id", "language", "learning_state")
    WHERE "deleted_at" IS NULL
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "vocabulary_reviews_user_created_idx"
    ON "vocabulary_reviews" ("user_id", "created_at")
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "practice_daily_minutes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
      "practice_date" date NOT NULL,
      "duration_ms" integer DEFAULT 0 NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "practice_daily_minutes_user_date_uidx"
    ON "practice_daily_minutes" ("user_id", "practice_date")
  `;

  const indexes = await sql`
    SELECT indexname FROM pg_indexes
    WHERE indexname IN (
      'vocabulary_items_user_due_active_idx',
      'vocabulary_items_user_lang_state_active_idx',
      'vocabulary_reviews_user_created_idx',
      'practice_daily_minutes_user_date_uidx'
    )
    ORDER BY indexname
  `;
  const table = await sql`
    SELECT to_regclass('public.practice_daily_minutes') AS reg
  `;
  console.log("indexes:", indexes.map((r) => r.indexname));
  console.log("practice_daily_minutes:", table[0]?.reg);
  console.log("Migrations applied successfully (idempotent IF NOT EXISTS).");
}

main().catch((e) => {
  console.error("Migration apply failed:", e);
  process.exit(1);
});
