import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { getEnv } from "./config/env";
import { initDb } from "./db";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { chatRouter } from "./routes/chat.routes";
import { languagesRouter } from "./routes/languages.routes";
import { settingsRouter } from "./routes/settings.routes";
import { vocabularyRouter } from "./routes/vocabulary.routes";

const env = getEnv();
initDb(env.DATABASE_URL);

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN ?? true,
  }),
);
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/languages", languagesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api", chatLimiter, chatRouter);
app.use("/api/vocabulary", vocabularyRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
