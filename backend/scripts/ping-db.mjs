import "dotenv/config";
import { neon, neonConfig } from "@neondatabase/serverless";
import https from "node:https";

neonConfig.fetchFunction = ((input, init) => {
  const target =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const method = init?.method ?? "GET";
  const headers = new Headers(init?.headers);
  const body = typeof init?.body === "string" ? init.body : undefined;

  return new Promise((resolve, reject) => {
    const url = new URL(target);
    console.log("fetch host:", url.hostname);
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
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve(
            new Response(text, {
              status: res.statusCode ?? 500,
              statusText: res.statusMessage,
              headers: res.headers,
            }),
          );
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    if (body) req.write(body);
    req.end();
  });
});

const sql = neon(process.env.DATABASE_URL);
try {
  const rows = await sql`select 1 as ok`;
  console.log("query ok:", rows);
} catch (e) {
  console.error("query fail:", e.cause?.message || e.message || e);
  process.exit(1);
}
