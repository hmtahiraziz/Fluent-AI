import { Router } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { userSettings, users } from "../db/schema";
import { authMiddleware, getUserId } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  getSettingsForUser,
  serializeSettings,
} from "../services/settings.service";
import {
  requestPasswordReset,
  resetPasswordWithToken,
  verifyResetOtp,
} from "../services/passwordReset.service";
import {
  issueTokenPair,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../services/session.service";
import { passwordSchema } from "../validation/password";

const registerSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: passwordSchema,
  /** Client must affirm age ≥13 (or local digital consent age). */
  ageConfirmed: z.literal(true),
});

const loginSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
});

const verifyResetOtpSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid six-digit code"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1).max(256),
  password: passwordSchema,
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1).max(512),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1).max(512).optional(),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
});

export const authRouter = Router();

authRouter.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new AppError(404, "User not found");
    const settings = await getSettingsForUser(userId);
    res.json({
      user,
      settings: settings ? serializeSettings(settings) : null,
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const db = getDb();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existing.length > 0) {
      // Avoid precise account oracle wording.
      throw new AppError(409, "Unable to create account with those credentials");
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db
      .insert(users)
      .values({ email: body.email, passwordHash })
      .returning({ id: users.id, email: users.email });

    if (!user) throw new AppError(500, "Failed to create user");

    await db.insert(userSettings).values({
      userId: user.id,
      targetLanguage: "es",
      nativeLanguage: "en",
      level: "A1",
      onboardingCompleted: false,
      dailyGoalMinutes: 10,
    });

    const settings = await getSettingsForUser(user.id);
    const tokens = await issueTokenPair(user.id);
    res.status(201).json({
      ...tokens,
      user,
      settings: settings ? serializeSettings(settings) : null,
    });
  } catch (e) {
    next(e);
  }
});

async function loginWithPassword(email: string, password: string) {
  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "Invalid email or password");
  }

  const settings = await getSettingsForUser(user.id);
  const tokens = await issueTokenPair(user.id);
  return {
    tokens,
    user: { id: user.id, email: user.email },
    settings: settings ? serializeSettings(settings) : null,
  };
}

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const session = await loginWithPassword(body.email, body.password);
    res.json({
      ...session.tokens,
      user: session.user,
      settings: session.settings,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * OAuth2 password-grant shape for Swagger UI Authorize (username = email).
 * Accepts application/x-www-form-urlencoded or JSON.
 */
authRouter.post("/token", async (req, res, next) => {
  try {
    const grantType = String(req.body?.grant_type ?? "password");
    if (grantType !== "password") {
      throw new AppError(400, "Unsupported grant_type");
    }

    const rawEmail = String(req.body?.username ?? req.body?.email ?? "")
      .toLowerCase()
      .trim();
    const password = String(req.body?.password ?? "");
    const parsed = loginSchema.safeParse({ email: rawEmail, password });
    if (!parsed.success) {
      throw new AppError(400, "username (email) and password are required");
    }

    const session = await loginWithPassword(
      parsed.data.email,
      parsed.data.password,
    );

    // OAuth2 token response — Swagger password flow expects access_token.
    res.json({
      access_token: session.tokens.accessToken,
      refresh_token: session.tokens.refreshToken,
      token_type: "Bearer",
      expires_in: 900,
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);
    const rotated = await rotateRefreshToken(body.refreshToken);
    res.json({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/logout", authMiddleware, async (req, res, next) => {
  try {
    const body = logoutSchema.parse(req.body ?? {});
    if (body.refreshToken) {
      await revokeRefreshToken(body.refreshToken);
    } else {
      await revokeAllRefreshTokensForUser(getUserId(req));
    }
    res.json({ message: "Logged out" });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const result = await requestPasswordReset(body.email);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post("/verify-reset-otp", async (req, res, next) => {
  try {
    const body = verifyResetOtpSchema.parse(req.body);
    const result = await verifyResetOtp(body.email, body.code);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const result = await resetPasswordWithToken(body.token, body.password);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.delete("/account", authMiddleware, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = deleteAccountSchema.parse(req.body);
    const db = getDb();

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new AppError(404, "User not found");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, "Invalid password");
    }

    await revokeAllRefreshTokensForUser(userId);
    await db.delete(users).where(eq(users.id, userId));

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
