import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db";
import { passwordResetTokens, users } from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(email: string) {
  const db = getDb();
  const normalized = email.toLowerCase().trim();

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (!user) {
    return {
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    };
  }

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, user.id));

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return {
    message: "Password reset token created.",
    resetToken: token,
  };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const db = getDb();
  const tokenHash = hashToken(token);
  const now = new Date();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AppError(400, "Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, row.userId));

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, row.userId));

  return { message: "Password updated successfully" };
}
