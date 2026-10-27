import https from "node:https";
import { URL } from "node:url";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * On this Windows host, undici's fetch to Neon times out while curl/https works.
 * Route Neon HTTP through Node's https module instead.
 */
neonConfig.fetchFunction = ((input: string | URL | Request, init?: RequestInit) => {
  const target = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = init?.method ?? "GET";
  const headers = new Headers(init?.headers);
  const body = typeof init?.body === "string" ? init.body : undefined;

  return new Promise((resolve, reject) => {
    const url = new URL(target);
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        headers: Object.fromEntries(headers.entries()),
        timeout: 60_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve(
            new Response(text, {
              status: res.statusCode ?? 500,
              statusText: res.statusMessage,
              headers: res.headers as HeadersInit,
            }),
          );
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("Neon HTTPS request timed out"));
    });
    if (body) req.write(body);
    req.end();
  });
}) as typeof fetch;

export type Database = NeonHttpDatabase<typeof schema>;

let dbInstance: Database | null = null;

function normalizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("channel_binding");
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

export function initDb(connectionString: string): Database {
  const sql = neon(normalizeDatabaseUrl(connectionString));
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

export function getDb(): Database {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return dbInstance;
}
