import nodemailer, { type Transporter } from "nodemailer";
import {
  getEmailFrom,
  getEnv,
  getSmtpPassword,
  isSmtpConfigured,
  type Env,
} from "../config/env";

let cachedTransporter: Transporter | null = null;

function createTransporter(env: Env = getEnv()): Transporter {
  const user = env.SMTP_USER;
  const pass = getSmtpPassword(env);
  if (!user || !pass) {
    throw new Error("SMTP is not configured");
  }

  if (env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: { user, pass },
    });
  }

  // Explicit Gmail SMTP is more reliable than the short `service: "gmail"` alias.
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

function getTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
}

/** Drop cached transporter (e.g. after auth failure so next send retries fresh). */
export function resetSmtpTransporter(): void {
  cachedTransporter = null;
}

/** Verify SMTP credentials / connectivity. Does not log secrets. */
export async function verifySmtp(): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured (SMTP_USER, SMTP_APP_PASSWORD, EMAIL_FROM)");
  }
  resetSmtpTransporter();
  const transporter = createTransporter();
  await transporter.verify();
  cachedTransporter = transporter;
}

export async function sendOtpEmail(recipient: string, code: string): Promise<boolean> {
  const env = getEnv();
  if (!isSmtpConfigured(env)) {
    if (env.NODE_ENV !== "production") {
      console.info(
        `[dev] Password-reset OTP for ${recipient}: ${code} (SMTP unset — delivered to console only)`,
      );
    }
    return false;
  }

  const ttl = env.OTP_TTL_MINUTES;
  const from = getEmailFrom(env)!;
  const subject = "Your FluentAI password reset code";

  const text = [
    "FluentAI password reset",
    "",
    `Your verification code is: ${code}`,
    "",
    `This code is valid for ${ttl} minutes.`,
    "",
    "If you did not request a password reset, you can safely ignore this email. Your account remains secure.",
    "",
    "— FluentAI",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:440px;background:#ffffff;border-radius:16px;padding:32px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td>
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;color:#5b4fcf;">FLUENTAI</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Password reset code</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#444;">
            Use this six-digit code in the FluentAI app to continue resetting your password.
          </p>
          <p style="margin:0 0 8px;text-align:center;font-size:32px;letter-spacing:0.35em;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
            ${code}
          </p>
          <p style="margin:0 0 24px;text-align:center;font-size:13px;color:#666;">
            Valid for ${ttl} minutes
          </p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#666;">
            If you did not request a password reset, you can safely ignore this email. Your account remains secure.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  try {
    await getTransporter().sendMail({
      from,
      to: recipient,
      subject,
      text,
      html,
    });
    if (env.NODE_ENV !== "production") {
      console.log(`[dev] Password-reset OTP emailed to ${recipient}`);
    }
    return true;
  } catch (err) {
    resetSmtpTransporter();
    if (env.NODE_ENV !== "production") {
      console.error("Password reset email failed:", err);
      console.log(
        `[dev] Password-reset OTP for ${recipient}: ${code} (email failed — use this code to continue testing)`,
      );
    }
    throw err;
  }
}
