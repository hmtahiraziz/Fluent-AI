import assert from "node:assert/strict";
import {
  mergeVocabFieldsOntoKeeper,
  normalizeVocabularyPhrase,
  planVocabularyDuplicateMerges,
} from "./vocabularyNormalize";

function testNormalize() {
  assert.deepEqual(normalizeVocabularyPhrase("  Hola   mundo  "), {
    phrase: "Hola mundo",
    phraseKey: "hola mundo",
  });
  assert.deepEqual(normalizeVocabularyPhrase("Café"), {
    phrase: "Café",
    phraseKey: "café",
  });
}

function testDuplicatePlan() {
  const plans = planVocabularyDuplicateMerges([
    {
      id: "b",
      userId: "u1",
      language: "es",
      phrase: "Hola",
      phraseKey: "hola",
      translation: null,
      note: "later",
      sourceMessageId: null,
      createdAt: "2026-01-02T00:00:00Z",
    },
    {
      id: "a",
      userId: "u1",
      language: "es",
      phrase: "hola",
      phraseKey: "hola",
      translation: "hi",
      note: null,
      sourceMessageId: "m1",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "c",
      userId: "u1",
      language: "es",
      phrase: "adios",
      phraseKey: "adios",
      translation: null,
      note: null,
      sourceMessageId: null,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ]);
  assert.equal(plans.length, 1);
  assert.equal(plans[0]!.keeperId, "a");
  assert.deepEqual(plans[0]!.loserIds, ["b"]);
}

function testMergeNullOnly() {
  const merged = mergeVocabFieldsOntoKeeper(
    { translation: "hi", note: null, sourceMessageId: null },
    { translation: "ignored", note: "n", sourceMessageId: "m" },
  );
  assert.deepEqual(merged, {
    translation: "hi",
    note: "n",
    sourceMessageId: "m",
  });
}

testNormalize();
testDuplicatePlan();
testMergeNullOnly();
console.log("vocabularyNormalize.test.ts: ok");
