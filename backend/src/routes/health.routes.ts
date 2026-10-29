import { Router } from "express";
import { sql } from "drizzle-orm";
import { getEnv } from "../config/env";
import { getDb } from "../db";

const startedAt = Date.now();

export const healthRouter = Router();

/**
 * Liveness — process is up. No dependency checks.
 * GET /health
 */
healthRouter.get("/", (_req, res) => {
  const env = getEnv();
  res.status(200).json({
    status: "ok",
    service: "fluentai-api",
    version: "1.0.0",
    env: env.NODE_ENV,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness — process + database reachable.
 * GET /health/ready  and  GET /api/health
 */
async function readinessHandler(
  _req: import("express").Request,
  res: import("express").Response,
) {
  const env = getEnv();
  const checks: { database: "up" | "down"; detail?: string } = {
    database: "down",
  };

  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    checks.database = "up";
  } catch (err) {
    checks.detail =
      env.NODE_ENV === "production"
        ? "unreachable"
        : err instanceof Error
          ? err.message
          : "unreachable";
  }

  const ready = checks.database === "up";
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "degraded",
    service: "fluentai-api",
    version: "1.0.0",
    env: env.NODE_ENV,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    checks,
    timestamp: new Date().toISOString(),
  });
}

healthRouter.get("/ready", readinessHandler);

export { readinessHandler };
