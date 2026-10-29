import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/** Cryptographically secure six-digit OTP (000000–999999). */
export function generateSixDigitOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** HMAC-SHA-256 of OTP bound to a user-specific context. Never store plaintext OTPs. */
export function hashOtp(secret: string, userId: string, code: string): string {
  return createHmac("sha256", secret)
    .update(`password-reset-otp:${userId}:${code}`)
    .digest("hex");
}

export function verifyOtpHash(
  secret: string,
  userId: string,
  code: string,
  expectedHash: string,
): boolean {
  const actual = hashOtp(secret, userId, code);
  try {
    const a = Buffer.from(actual, "hex");
    const b = Buffer.from(expectedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isSixDigitOtp(code: string): boolean {
  return /^\d{6}$/.test(code);
}
