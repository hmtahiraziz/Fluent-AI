import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import path from "node:path";
import { getEnv } from "./config/env";
import { mountSwagger } from "./docs/swagger";
import { initDb } from "./db";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { chatRouter } from "./routes/chat.routes";
import { healthRouter, readinessHandler } from "./routes/health.routes";
import { languagesRouter } from "./routes/languages.routes";
import { reportsRouter } from "./routes/reports.routes";
import { settingsRouter } from "./routes/settings.routes";
import { vocabularyRouter } from "./routes/vocabulary.routes";
import { progressRouter } from "./routes/progress.routes";

const env = getEnv();
initDb(env.DATABASE_URL);

const app = express();

if (env.TRUST_PROXY || env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: env.NODE_ENV === "production" ? undefined : false,
  }),
);
app.use(hpp());

const corsOrigins = !env.CORS_ORIGIN
  ? true
  : env.CORS_ORIGIN.trim() === "*"
    ? true
    : env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.use(
  "/public",
  express.static(path.join(__dirname, "..", "public"), {
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many account requests. Please wait a few minutes and try again." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset attempts. Try again later." },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "You're sending messages too quickly. Please wait a moment and try again.",
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests right now. Please wait a moment and try again.",
  },
});

app.use("/health", healthRouter);
app.get("/api/health", readinessHandler);

mountSwagger(app);

// Convenience alias for password-reset emails / App Links.
app.get("/reset-password", (req, res) => {
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.redirect(302, `/public/reset-password.html${query}`);
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/token", loginLimiter);
app.use("/api/auth/forgot-password", resetLimiter);
app.use("/api/auth/verify-reset-otp", resetLimiter);
app.use("/api/auth/reset-password", resetLimiter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/languages", languagesRouter);
app.use("/api/settings", apiLimiter, settingsRouter);
app.use("/api/reports", chatLimiter, reportsRouter);
app.use("/api", chatLimiter, chatRouter);
app.use("/api/vocabulary", apiLimiter, vocabularyRouter);
app.use("/api/progress", apiLimiter, progressRouter);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
  console.log(
    `Swagger UI: http://localhost:${env.PORT}/api/docs (Basic auth: SWAGGER_USER / SWAGGER_PASSWORD)`,
  );
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
