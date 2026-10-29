import assert from "node:assert/strict";
import { serializeVocabItem } from "./vocabulary.service";
import type { vocabularyItems } from "../db/schema";

type Row = typeof vocabularyItems.$inferSelect;

function sampleRow(overrides: Partial<Row> = {}): Row {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    userId: "22222222-2222-2222-2222-222222222222",
    language: "es",
    phrase: "hola",
    phraseKey: "hola",
    translation: "hi",
    note: null,
    pronunciation: null,
    exampleSentence: null,
    sourceMessageId: null,
    learningState: "new",
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    nextReviewAt: null,
    lastReviewedAt: null,
    reviewVersion: 0,
    lastReviewClientRequestId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

function testLegacyFieldsPresent() {
  const item = serializeVocabItem(sampleRow());
  for (const key of [
    "id",
    "userId",
    "language",
    "phrase",
    "translation",
    "note",
    "sourceMessageId",
    "createdAt",
  ] as const) {
    assert.ok(key in item, `missing ${key}`);
  }
  assert.equal(item.phrase, "hola");
  assert.equal(item.createdAt, "2026-01-01T00:00:00.000Z");
}

function testCreateResponseShape() {
  const item = serializeVocabItem(sampleRow());
  const created = { item, created: true as const };
  const existing = { item, created: false as const };
  assert.equal(typeof created.item.id, "string");
  assert.equal(created.created, true);
  assert.equal(existing.created, false);
}

const tests = [testLegacyFieldsPresent, testCreateResponseShape];
for (const t of tests) t();
console.log(`vocabularyCompat.test.ts: ${tests.length} passed`);
