import bcrypt from "bcrypt";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getEnv, getOtpSecret } from "../config/env";
import { getDb } from "../db";
import { passwordResetTokens, users } from "../db/schema";
import { AppError } from "../middleware/errorHandler";
import { sendOtpEmail } from "./email.service";
import { revokeAllRefreshTokensForUser } from "./session.service";
import {
  generateOpaqueToken,
  generateSixDigitOtp,
  hashOpaqueToken,
  hashOtp,
  isSixDigitOtp,
  verifyOtpHash,
} from "./tokenHash";

const PURPOSE_OTP = "otp";
const PURPOSE_AUTH = "authorization";

const GENERIC_MESSAGE =
  "If an account exists for that email, a password reset code has been sent.";

function otpTtlMs(env = getEnv()) {
  return env.OTP_TTL_MINUTES * 60 * 1000;
}

function resendCooldownMs(env = getEnv()) {
  return env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
}

function resetAuthTtlMs(env = getEnv()) {
  return env.RESET_AUTH_TTL_MINUTES * 60 * 1000;
}

async function findUserByEmail(email: string) {
  const db = getDb();
  const normalized = email.toLowerCase().trim();
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  return user ?? null;
}

async function invalidateAllResetRowsForUser(userId: string) {
  const db = getDb();
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
}

/**
 * POST /forgot-password — always returns a generic message (no account oracle).
 */
export async function requestPasswordReset(email: string) {
  const env = getEnv();
  const user = await findUserByEmail(email);

  if (!user) {
    return { message: GENERIC_MESSAGE };
  }

  const db = getDb();
  const [latestOtp] = await db
    .select({ createdAt: passwordResetTokens.createdAt })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.purpose, PURPOSE_OTP),
      ),
    )
    .orderBy(desc(passwordResetTokens.createdAt))
    .limit(1);

  if (
    latestOtp &&
    Date.now() - latestOtp.createdAt.getTime() < resendCooldownMs(env)
  ) {
    // Same generic body; client uses local cooldown for UX.
    return { message: GENERIC_MESSAGE };
  }

  await invalidateAllResetRowsForUser(user.id);

  const code = generateSixDigitOtp();
  const secret = getOtpSecret(env);
  const expiresAt = new Date(Date.now() + otpTtlMs(env));

  const [created] = await db
    .insert(passwordResetTokens)
    .values({
      userId: user.id,
      tokenHash: hashOtp(secret, user.id, code),
      purpose: PURPOSE_OTP,
      attemptCount: 0,
      expiresAt,
    })
    .returning({ id: passwordResetTokens.id });

  try {
    await sendOtpEmail(user.email, code);
  } catch {
    // Do not leave a cooldown-blocking OTP when delivery failed —
    // otherwise retries silently no-op for 60s with no email.
    if (created?.id) {
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, created.id));
    }
  }

  return { message: GENERIC_MESSAGE };
}

/**
 * POST /verify-reset-otp — email + 6-digit code → short-lived reset authorization token.
 */
export async function verifyResetOtp(email: string, code: string) {
  const env = getEnv();
  const normalizedCode = code.trim();

  if (!isSixDigitOtp(normalizedCode)) {
    throw new AppError(400, "Enter a valid six-digit code");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    // Same client-facing error as a wrong code — avoid account enumeration.
    throw new AppError(400, "Invalid or expired code");
  }

  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.purpose, PURPOSE_OTP),
        isNull(passwordResetTokens.consumedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .orderBy(desc(passwordResetTokens.createdAt))
    .limit(1);

  if (!row) {
    throw new AppError(400, "Invalid or expired code");
  }

  if (row.attemptCount >= env.OTP_MAX_ATTEMPTS) {
    throw new AppError(400, "Too many invalid attempts. Request a new code.");
  }

  const secret = getOtpSecret(env);
  const ok = verifyOtpHash(secret, user.id, normalizedCode, row.tokenHash);

  if (!ok) {
    const nextAttempts = row.attemptCount + 1;
    await db
      .update(passwordResetTokens)
      .set({ attemptCount: nextAttempts })
      .where(eq(passwordResetTokens.id, row.id));

    if (nextAttempts >= env.OTP_MAX_ATTEMPTS) {
      throw new AppError(400, "Too many invalid attempts. Request a new code.");
    }
    throw new AppError(400, "Invalid or expired code");
  }

  // Consume OTP (compare-and-set) to prevent concurrent reuse.
  const [consumed] = await db
    .update(passwordResetTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(passwordResetTokens.id, row.id),
        isNull(passwordResetTokens.consumedAt),
      ),
    )
    .returning({ id: passwordResetTokens.id });

  if (!consumed) {
    throw new AppError(400, "Invalid or expired code");
  }

  // Drop any leftover OTPs; issue a single authorization token.
  await db
    .delete(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.purpose, PURPOSE_OTP),
      ),
    );

  await db
    .delete(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.purpose, PURPOSE_AUTH),
      ),
    );

  const resetToken = generateOpaqueToken(32);
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashOpaqueToken(resetToken),
    purpose: PURPOSE_AUTH,
    attemptCount: 0,
    expiresAt: new Date(Date.now() + resetAuthTtlMs(env)),
  });

  return {
    resetToken,
    expiresInMinutes: env.RESET_AUTH_TTL_MINUTES,
    message: "Code verified. You may set a new password.",
  };
}

/**
 * POST /reset-password — requires authorization token from successful OTP verify.
 */
export async function resetPasswordWithToken(token: string, password: string) {
  const db = getDb();
  const tokenHash = hashOpaqueToken(token.trim());
  const now = new Date();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        eq(passwordResetTokens.purpose, PURPOSE_AUTH),
        isNull(passwordResetTokens.consumedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AppError(400, "Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Consume authorization token first (CAS) to prevent concurrent password changes.
  const [consumed] = await db
    .update(passwordResetTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(passwordResetTokens.id, row.id),
        isNull(passwordResetTokens.consumedAt),
      ),
    )
    .returning({ id: passwordResetTokens.id, userId: passwordResetTokens.userId });

  if (!consumed) {
    throw new AppError(400, "Invalid or expired reset token");
  }

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, consumed.userId));

  await invalidateAllResetRowsForUser(consumed.userId);
  await revokeAllRefreshTokensForUser(consumed.userId);

  return { message: "Password updated successfully" };
}
