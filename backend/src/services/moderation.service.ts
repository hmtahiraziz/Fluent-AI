import OpenAI from "openai";
import { getEnv } from "../config/env";
import { AppError } from "../middleware/errorHandler";

function getOpenAI(): OpenAI {
  const env = getEnv();
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: Math.min(env.OPENAI_TIMEOUT_MS, 15_000),
    maxRetries: 0,
  });
}

/** Returns true if content is flagged by OpenAI Moderation. */
export async function isContentFlagged(
  text: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const env = getEnv();
  if (env.AI_MODERATION_ENABLED === false) return false;

  const client = getOpenAI();
  const result = await client.moderations.create(
    { model: "omni-moderation-latest", input: text },
    { signal },
  );
  return Boolean(result.results[0]?.flagged);
}

export async function assertSafeForTutor(
  userText: string,
  signal?: AbortSignal,
): Promise<void> {
  try {
    if (await isContentFlagged(userText, signal)) {
      throw new AppError(
        400,
        "Message blocked by safety filters. Please rephrase and try again.",
      );
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    // Fail closed on moderation outages in production; allow in dev.
    if (getEnv().NODE_ENV === "production") {
      throw new AppError(503, "Safety check temporarily unavailable. Try again shortly.");
    }
  }
}

export async function assertSafeTutorReply(
  reply: string,
  signal?: AbortSignal,
): Promise<void> {
  try {
    if (await isContentFlagged(reply, signal)) {
      throw new AppError(
        502,
        "Tutor reply blocked by safety filters. Please try another message.",
      );
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (getEnv().NODE_ENV === "production") {
      throw new AppError(503, "Safety check temporarily unavailable. Try again shortly.");
    }
  }
}
