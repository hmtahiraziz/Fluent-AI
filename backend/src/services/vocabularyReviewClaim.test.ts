import assert from "node:assert/strict";
import { applyVocabRating, DEFAULT_EASE } from "./vocabularySrs";

/**
 * In-memory model of the Neon-HTTP claim + CAS rules (no DB).
 * Validates: duplicate clientRequestId never double-applies; partial failure recovers.
 */

type Card = {
  id: string;
  userId: string;
  reviewVersion: number;
  lastReviewClientRequestId: string | null;
  deletedAt: Date | null;
  learningState: "new" | "learning" | "review" | "difficult" | "mastered";
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  nextReviewAt: Date | null;
};

type Claim = {
  id: string;
  userId: string;
  itemId: string;
  clientRequestId: string;
  status: "pending" | "completed" | "failed";
  rating: "again" | "hard" | "good" | "easy";
  responseJson: { version: number; nextReviewAt: string | null } | null;
};

function reviewOnce(
  store: { card: Card; claims: Map<string, Claim> },
  userId: string,
  itemId: string,
  clientRequestId: string,
  rating: Claim["rating"],
  now: Date,
  opts?: { crashAfterCardUpdate?: boolean },
): { version: number; nextReviewAt: string | null } {
  const key = `${userId}:${clientRequestId}`;
  let claim = store.claims.get(key);
  if (claim && claim.itemId !== itemId) {
    throw new Error("client_request_conflict");
  }
  if (claim?.status === "completed" && claim.responseJson) {
    return claim.responseJson;
  }

  const card = store.card;
  if (card.userId !== userId || card.id !== itemId || card.deletedAt) {
    throw new Error("not_found");
  }

  if (!claim) {
    claim = {
      id: `c-${store.claims.size}`,
      userId,
      itemId: card.id,
      clientRequestId,
      status: "pending",
      rating,
      responseJson: null,
    };
    store.claims.set(key, claim);
  }

  if (card.lastReviewClientRequestId === clientRequestId) {
    const response = {
      version: card.reviewVersion,
      nextReviewAt: card.nextReviewAt?.toISOString() ?? null,
    };
    claim.status = "completed";
    claim.responseJson = response;
    return response;
  }

  const baseVersion = card.reviewVersion;
  const srs = applyVocabRating(
    {
      learningState: card.learningState,
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays,
      repetitions: card.repetitions,
      lapses: card.lapses,
    },
    rating,
    now,
  );

  if (
    card.reviewVersion !== baseVersion ||
    card.lastReviewClientRequestId === clientRequestId
  ) {
    throw new Error("conflict");
  }

  // Apply CAS
  card.learningState = srs.learningState;
  card.easeFactor = srs.easeFactor;
  card.intervalDays = srs.intervalDays;
  card.repetitions = srs.repetitions;
  card.lapses = srs.lapses;
  card.nextReviewAt = srs.nextReviewAt;
  card.lastReviewClientRequestId = clientRequestId;
  card.reviewVersion += 1;

  if (opts?.crashAfterCardUpdate) {
    // Leave claim pending — simulates process death after card UPDATE.
    return {
      version: card.reviewVersion,
      nextReviewAt: card.nextReviewAt.toISOString(),
    };
  }

  const response = {
    version: card.reviewVersion,
    nextReviewAt: card.nextReviewAt.toISOString(),
  };
  claim.status = "completed";
  claim.responseJson = response;
  return response;
}

function freshStore(): { card: Card; claims: Map<string, Claim> } {
  return {
    card: {
      id: "item-1",
      userId: "user-1",
      reviewVersion: 0,
      lastReviewClientRequestId: null,
      deletedAt: null,
      learningState: "new",
      easeFactor: DEFAULT_EASE,
      intervalDays: 0,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: null,
    },
    claims: new Map(),
  };
}

function testDuplicateNeverDoubleApplies() {
  const store = freshStore();
  const now = new Date("2026-06-15T12:00:00.000Z");
  const a = reviewOnce(store, "user-1", "item-1", "req-1", "good", now);
  const b = reviewOnce(store, "user-1", "item-1", "req-1", "good", now);
  assert.equal(store.card.reviewVersion, 1);
  assert.deepEqual(a, b);
  assert.equal(store.card.intervalDays, 1);
}

function testPartialFailureRecovery() {
  const store = freshStore();
  const now = new Date("2026-06-15T12:00:00.000Z");
  reviewOnce(store, "user-1", "item-1", "req-crash", "good", now, {
    crashAfterCardUpdate: true,
  });
  assert.equal(store.claims.get("user-1:req-crash")!.status, "pending");
  assert.equal(store.card.reviewVersion, 1);
  assert.equal(store.card.lastReviewClientRequestId, "req-crash");

  const recovered = reviewOnce(
    store,
    "user-1",
    "item-1",
    "req-crash",
    "good",
    now,
  );
  assert.equal(store.card.reviewVersion, 1);
  assert.equal(store.claims.get("user-1:req-crash")!.status, "completed");
  assert.equal(recovered.version, 1);
}

function testDifferentClientIdsConflictThenApply() {
  const store = freshStore();
  const now = new Date("2026-06-15T12:00:00.000Z");
  reviewOnce(store, "user-1", "item-1", "req-a", "good", now);
  // Second rating with new id should apply on latest version
  reviewOnce(store, "user-1", "item-1", "req-b", "good", now);
  assert.equal(store.card.reviewVersion, 2);
  assert.equal(store.card.repetitions, 2);
}

function testOwnership() {
  const store = freshStore();
  const now = new Date("2026-06-15T12:00:00.000Z");
  assert.throws(
    () => reviewOnce(store, "other-user", "item-1", "req-1", "good", now),
    /not_found/,
  );
  assert.equal(store.card.reviewVersion, 0);
}

function testSoftDeletedBlocked() {
  const store = freshStore();
  store.card.deletedAt = new Date();
  const now = new Date("2026-06-15T12:00:00.000Z");
  assert.throws(
    () => reviewOnce(store, "user-1", "item-1", "req-1", "good", now),
    /not_found/,
  );
}

function testCrossItemClientRequestRejected() {
  const store = freshStore();
  const now = new Date("2026-06-15T12:00:00.000Z");
  reviewOnce(store, "user-1", "item-1", "req-shared", "good", now);
  assert.throws(
    () => reviewOnce(store, "user-1", "item-other", "req-shared", "easy", now),
    /client_request_conflict/,
  );
  assert.equal(store.card.reviewVersion, 1);
}

const tests = [
  testDuplicateNeverDoubleApplies,
  testPartialFailureRecovery,
  testDifferentClientIdsConflictThenApply,
  testOwnership,
  testSoftDeletedBlocked,
  testCrossItemClientRequestRejected,
];
for (const t of tests) t();
console.log(`vocabularyReviewClaim.test.ts: ${tests.length} passed`);
