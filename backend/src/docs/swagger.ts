import crypto from "node:crypto";
import type { Express, NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { getEnv } from "../config/env";
import { openApiDocument } from "./openapi";

function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // Constant-time-ish reject without short-circuiting on equal lengths only.
    crypto.timingSafeEqual(left, Buffer.alloc(left.length));
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

/** HTTP Basic gate for Swagger UI (SWAGGER_USER / SWAGGER_PASSWORD). */
function swaggerBasicAuth(req: Request, res: Response, next: NextFunction) {
  const { SWAGGER_USER, SWAGGER_PASSWORD } = getEnv();
  const header = req.headers.authorization;

  if (!header?.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="FluentAI API Docs"');
    res.status(401).send("Authentication required");
    return;
  }

  let decoded = "";
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    res.setHeader("WWW-Authenticate", 'Basic realm="FluentAI API Docs"');
    res.status(401).send("Authentication required");
    return;
  }

  const sep = decoded.indexOf(":");
  const user = sep >= 0 ? decoded.slice(0, sep) : decoded;
  const pass = sep >= 0 ? decoded.slice(sep + 1) : "";

  const userOk = timingSafeEqualString(user, SWAGGER_USER);
  const passOk = timingSafeEqualString(pass, SWAGGER_PASSWORD);
  if (!userOk || !passOk) {
    res.setHeader("WWW-Authenticate", 'Basic realm="FluentAI API Docs"');
    res.status(401).send("Invalid credentials");
    return;
  }

  next();
}

/** Mount Swagger UI at /api/docs (docs Basic auth + API passwordAuth Authorize). */
export function mountSwagger(app: Express): void {
  app.use(
    "/api/docs",
    swaggerBasicAuth,
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "FluentAI API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    }),
  );
}
