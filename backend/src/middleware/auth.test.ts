import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { authMiddleware, signAccessToken } from "./auth";
import { getEnv, resetEnvCache } from "../config/env";

function mockRes() {
  const state: { statusCode?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
  } as unknown as Response;
  return { res, state };
}

function ensureTestEnv() {
  process.env.NODE_ENV ??= "test";
  process.env.DATABASE_URL ??= "postgres://localhost/test";
  process.env.JWT_SECRET ??= "test-jwt-secret-at-least-32-characters-long";
  process.env.OPENAI_API_KEY ??= "sk-test";
  resetEnvCache();
  getEnv();
}

function testMissingHeader() {
  ensureTestEnv();
  const { res, state } = mockRes();
  let nextCalled = false;
  authMiddleware(
    { headers: {} } as Request,
    res,
    (() => {
      nextCalled = true;
    }) as NextFunction,
  );
  assert.equal(state.statusCode, 401);
  assert.equal(nextCalled, false);
}

function testExpiredOrInvalidToken() {
  ensureTestEnv();
  const { res, state } = mockRes();
  let nextCalled = false;
  authMiddleware(
    { headers: { authorization: "Bearer not-a-jwt" } } as Request,
    res,
    (() => {
      nextCalled = true;
    }) as NextFunction,
  );
  assert.equal(state.statusCode, 401);
  assert.equal(nextCalled, false);
}

function testValidToken() {
  ensureTestEnv();
  const token = signAccessToken("user-123");
  const { res, state } = mockRes();
  const req = {
    headers: { authorization: `Bearer ${token}` },
  } as Request;
  let nextCalled = false;
  authMiddleware(req, res, (() => {
    nextCalled = true;
  }) as NextFunction);
  assert.equal(nextCalled, true);
  assert.equal(state.statusCode, undefined);
  assert.equal((req as Request & { userId: string }).userId, "user-123");
}

testMissingHeader();
testExpiredOrInvalidToken();
testValidToken();
console.log("auth.test.ts: ok");
