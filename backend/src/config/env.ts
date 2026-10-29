import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    OPENAI_MAX_TOKENS: z.coerce.number().int().min(64).max(4000).default(800),
    OPENAI_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120000).default(45000),
    AI_DAILY_QUOTA: z.coerce.number().int().min(1).max(10000).default(100),
    /** Recent chat turns sent to the tutor model (clamped 5–50 in chat service). */
    CHAT_HISTORY_LIMIT: z.coerce.number().int().min(5).max(50).default(20),
    /** When true (default), run OpenAI Moderation on user messages and tutor replies. */
    AI_MODERATION_ENABLED: z
      .string()
      .default("true")
      .transform((v) => v !== "0" && v.toLowerCase() !== "false"),
    CORS_ORIGIN: z.string().optional(),
    APP_PUBLIC_URL: z.string().url().optional(),
    SUPPORT_EMAIL: z.string().email().optional(),
    /** Gmail address used for SMTP auth. */
    SMTP_USER: z.string().optional(),
    /** Gmail App Password (spaces allowed; stripped at runtime). Prefer over SMTP_PASS. */
    SMTP_APP_PASSWORD: z.string().optional(),
    /** Legacy alias for SMTP_APP_PASSWORD. */
    SMTP_PASS: z.string().optional(),
    /** Sender display, e.g. FluentAI <you@gmail.com>. Prefer over SMTP_FROM. */
    EMAIL_FROM: z.string().optional(),
    /** Legacy alias for EMAIL_FROM. */
    SMTP_FROM: z.string().optional(),
    /** Optional override; when unset, Gmail service transport is used. */
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    OTP_SECRET: z.string().optional(),
    OTP_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
    OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(10).max(600).default(60),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
    /** Short-lived token after OTP verify, before password change. */
    RESET_AUTH_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
    TRUST_PROXY: z
      .string()
      .optional()
      .transform((v) => v === "1" || v?.toLowerCase() === "true"),
    /** HTTP Basic credentials that gate Swagger UI at /api/docs */
    SWAGGER_USER: z.string().min(1).default("fluentai"),
    SWAGGER_PASSWORD: z.string().min(1).default("fluentai"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;

    if (env.SWAGGER_PASSWORD.length < 8 || env.SWAGGER_PASSWORD === "fluentai") {
      ctx.addIssue({
        code: "custom",
        path: ["SWAGGER_PASSWORD"],
        message:
          "SWAGGER_PASSWORD must be at least 8 characters and must not use the development default in production",
      });
    }

    if (!env.CORS_ORIGIN) {
      ctx.addIssue({
        code: "custom",
        path: ["CORS_ORIGIN"],
        message: "CORS_ORIGIN is required in production",
      });
    }

    const smtpPass = env.SMTP_APP_PASSWORD || env.SMTP_PASS;
    const emailFrom = env.EMAIL_FROM || env.SMTP_FROM;
    if (!env.SMTP_USER || !smtpPass || !emailFrom) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_USER"],
        message:
          "SMTP_USER, SMTP_APP_PASSWORD (or SMTP_PASS), and EMAIL_FROM (or SMTP_FROM) are required in production",
      });
    }

    if (!env.OTP_SECRET || env.OTP_SECRET.length < 32) {
      ctx.addIssue({
        code: "custom",
        path: ["OTP_SECRET"],
        message: "OTP_SECRET must be at least 32 characters in production",
      });
    }

    if (!env.APP_PUBLIC_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_PUBLIC_URL"],
        message: "APP_PUBLIC_URL is required in production (HTTPS reset / privacy links)",
      });
    } else if (!env.APP_PUBLIC_URL.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_PUBLIC_URL"],
        message: "APP_PUBLIC_URL must use HTTPS in production",
      });
    }
    if (!env.SUPPORT_EMAIL) {
      ctx.addIssue({
        code: "custom",
        path: ["SUPPORT_EMAIL"],
        message: "SUPPORT_EMAIL is required in production",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  cached = parsed.data;
  return cached;
}

/** Reset env cache (tests only). */
export function resetEnvCache(): void {
  cached = null;
}

export function getSmtpPassword(env: Env = getEnv()): string | undefined {
  const raw = env.SMTP_APP_PASSWORD || env.SMTP_PASS;
  return raw ? raw.replace(/\s+/g, "") : undefined;
}

export function getEmailFrom(env: Env = getEnv()): string | undefined {
  return env.EMAIL_FROM || env.SMTP_FROM;
}

export function isSmtpConfigured(env: Env = getEnv()): boolean {
  return Boolean(env.SMTP_USER && getSmtpPassword(env) && getEmailFrom(env));
}

export function getOtpSecret(env: Env = getEnv()): string {
  if (env.OTP_SECRET && env.OTP_SECRET.length >= 32) {
    return env.OTP_SECRET;
  }
  if (env.NODE_ENV === "production") {
    throw new Error("OTP_SECRET is required in production");
  }
  // Dev fallback derived from JWT so local reset works without extra setup.
  // Never used in production (validated above).
  return env.JWT_SECRET;
}
