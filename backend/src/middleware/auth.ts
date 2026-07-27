import type { Request, Response, NextFunction } from "express";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { getEnv } from "../config/env";

export type AuthRequest = Request & { userId: string };

export function getUserId(req: Request): string {
  return (req as AuthRequest).userId;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getEnv().JWT_SECRET) as { sub: string };
    (req as AuthRequest).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function signAccessToken(userId: string): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getEnv();
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId }, JWT_SECRET as Secret, options);
}
