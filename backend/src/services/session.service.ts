import { and, eq, gt, isNull } from "drizzle-orm";
import { getEnv } from "../config/env";
import { getDb } from "../db";
import { refreshTokens } from "../db/schema";
import { AppError } from "../middleware/errorHandler";
import { generateOpaqueToken, hashOpaqueToken } from "./tokenHash";
import { signAccessToken } from "../middleware/auth";

export async function issueRefreshToken(userId: string): Promise<string> {
  const db = getDb();
  const raw = generateOpaqueToken(48);
  const tokenHash = hashOpaqueToken(raw);
  const days = getEnv().REFRESH_TOKEN_TTL_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return raw;
}

export async function issueTokenPair(userId: string) {
  const [accessToken, refreshToken] = await Promise.all([
    Promise.resolve(signAccessToken(userId)),
    issueRefreshToken(userId),
  ]);
  return { accessToken, refreshToken };
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  const db = getDb();
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
    );
}

export async function revokeRefreshToken(rawToken: string) {
  const db = getDb();
  const tokenHash = hashOpaqueToken(rawToken);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

/**
 * Rotate with compare-and-swap revoke first, then issue replacement.
 * Reuse of an already-revoked token revokes all sessions for that user.
 */
export async function rotateRefreshToken(rawToken: string) {
  const db = getDb();
  const tokenHash = hashOpaqueToken(rawToken);
  const now = new Date();

  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  if (row.revokedAt) {
    await revokeAllRefreshTokensForUser(row.userId);
    throw new AppError(401, "Refresh token reuse detected");
  }

  if (row.expiresAt <= now) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  // CAS revoke before issuing a new refresh — prevents dual-valid tokens on race.
  const revoked = await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(
      and(
        eq(refreshTokens.id, row.id),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, now),
      ),
    )
    .returning({ id: refreshTokens.id });

  if (revoked.length === 0) {
    // Another request won the race — treat as reuse.
    await revokeAllRefreshTokensForUser(row.userId);
    throw new AppError(401, "Refresh token reuse detected");
  }

  const newRefresh = await issueRefreshToken(row.userId);
  const newHash = hashOpaqueToken(newRefresh);

  await db
    .update(refreshTokens)
    .set({ replacedByHash: newHash })
    .where(eq(refreshTokens.id, row.id));

  const accessToken = signAccessToken(row.userId);
  return {
    accessToken,
    refreshToken: newRefresh,
    userId: row.userId,
  };
}
