import "dotenv/config";
import nodemailer from "nodemailer";

const user = process.env.SMTP_USER?.trim();
const passRaw = process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS;
const pass = passRaw ? passRaw.replace(/\s+/g, "") : "";
const from = process.env.EMAIL_FROM || process.env.SMTP_FROM;

if (!user || !pass || !from) {
  console.error(
    "Missing SMTP config. Set SMTP_USER, SMTP_APP_PASSWORD (or SMTP_PASS), and EMAIL_FROM (or SMTP_FROM).",
  );
  process.exit(1);
}

const host = process.env.SMTP_HOST;
const transporter = host
  ? nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user, pass },
    })
  : nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

try {
  await transporter.verify();
  console.log("SMTP connection: OK");
  console.log(`SMTP user configured: yes (${user.length} chars)`);
  console.log(`From address configured: yes`);
} catch (err) {
  console.error("SMTP connection: FAILED");
  console.error(err instanceof Error ? err.message : "Unknown error");
  process.exit(1);
}

const to = process.env.SMTP_TEST_TO?.trim() || user;
if (process.argv.includes("--send")) {
  await transporter.sendMail({
    from,
    to,
    subject: "FluentAI SMTP test",
    text: "FluentAI SMTP verification succeeded. You can ignore this message.",
  });
  console.log(`Test email accepted for delivery to configured recipient.`);
}
