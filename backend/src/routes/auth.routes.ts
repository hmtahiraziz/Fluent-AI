import { Router } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { userSettings, users } from "../db/schema";
import { signAccessToken, authMiddleware, getUserId } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  getSettingsForUser,
  serializeSettings,
} from "../services/settings.service";

const registerSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1),
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
      throw new AppError(409, "Email already registered");
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
    const accessToken = signAccessToken(user.id);
    res.status(201).json({
      accessToken,
      user,
      settings: settings ? serializeSettings(settings) : null,
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const db = getDb();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, "Invalid email or password");
    }

    const settings = await getSettingsForUser(user.id);
    const accessToken = signAccessToken(user.id);
    res.json({
      accessToken,
      user: { id: user.id, email: user.email },
      settings: settings ? serializeSettings(settings) : null,
    });
  } catch (e) {
    next(e);
  }
});
