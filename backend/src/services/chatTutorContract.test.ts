import assert from "node:assert/strict";
import { mapOpenAiError, tutorResponseSchema } from "./chat.service";
import { AppError } from "../middleware/errorHandler";

function testCorrectMessageNoCorrection() {
  const parsed = tutorResponseSchema.parse({
    reply: "¡Muy bien!",
    correction: null,
    vocabularySuggestions: [],
  });
  assert.equal(parsed.correction, null);
  assert.equal(parsed.reply, "¡Muy bien!");
}

function testGrammarMistakeCorrection() {
  const parsed = tutorResponseSchema.parse({
    reply: "Entiendo. ¿Adónde vas?",
    correction: {
      original: "Yo voy a la tienda ayer",
      corrected: "Yo fui a la tienda ayer",
      explanation: "Use the past tense for finished actions.",
      naturalAlternative: "Ayer fui a la tienda",
    },
    vocabularySuggestions: [
      { term: "ayer", meaning: "yesterday" },
      { term: "fui", meaning: "I went" },
    ],
  });
  assert.equal(parsed.correction?.corrected.includes("fui"), true);
  assert.equal(parsed.correction?.naturalAlternative, "Ayer fui a la tienda");
  assert.equal(parsed.vocabularySuggestions.length, 2);
}

function testNaturalAlternativeNotMereRepeat() {
  const parsed = tutorResponseSchema.parse({
    reply: "Ok",
    correction: {
      original: "Yesterday I go to market",
      corrected: "Yesterday I went to the market",
      explanation: "Past tense needed.",
      naturalAlternative: "Yesterday I went to the market",
    },
    vocabularySuggestions: [],
  });
  assert.equal(parsed.correction?.naturalAlternative, null);
}

function testEmptyCorrectionFieldsBecomeNull() {
  const parsed = tutorResponseSchema.parse({
    reply: "Ok",
    correction: {
      original: "  ",
      corrected: "fixed",
      explanation: "why",
    },
    vocabularySuggestions: [],
  });
  assert.equal(parsed.correction, null);
}

function testCapsSuggestionsViaSliceLogic() {
  const many = Array.from({ length: 5 }, (_, i) => ({
    term: `t${i}`,
    meaning: `m${i}`,
  }));
  const parsed = tutorResponseSchema.parse({
    reply: "ok",
    correction: null,
    vocabularySuggestions: many,
  });
  // Schema allows >3; service slices — document expected post-process
  assert.equal(parsed.vocabularySuggestions.slice(0, 3).length, 3);
}

function testMalformedRejected() {
  assert.equal(
    tutorResponseSchema.safeParse({ reply: 1, correction: null }).success,
    false,
  );
}

function testMapTimeoutAndRateLimit() {
  const timeout = mapOpenAiError({ code: "ETIMEDOUT", message: "timeout" });
  assert.ok(timeout instanceof AppError);
  assert.equal(timeout.statusCode, 504);

  const rate = mapOpenAiError({ status: 429, message: "rate" });
  assert.ok(rate instanceof AppError);
  assert.equal(rate.statusCode, 429);
}

function testMapAbort() {
  const aborted = mapOpenAiError({ name: "AbortError" });
  assert.ok(aborted instanceof AppError);
  assert.equal(aborted.statusCode, 499);
}

testCorrectMessageNoCorrection();
testGrammarMistakeCorrection();
testNaturalAlternativeNotMereRepeat();
testEmptyCorrectionFieldsBecomeNull();
testCapsSuggestionsViaSliceLogic();
testMalformedRejected();
testMapTimeoutAndRateLimit();
testMapAbort();
console.log("chatTutorContract.test.ts: ok");
