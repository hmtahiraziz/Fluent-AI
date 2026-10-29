import assert from "node:assert/strict";
import { z } from "zod";
import {
  LEVEL_GUIDANCE,
  buildTutorSystemPrompt,
  tutorResponseJsonSchema,
} from "./prompts";

const tutorResponseSchema = z.object({
  reply: z.string().min(1),
  correction: z
    .object({
      original: z.string(),
      corrected: z.string(),
      explanation: z.string(),
    })
    .nullable(),
  vocabularySuggestions: z
    .array(z.object({ term: z.string(), meaning: z.string() }))
    .default([]),
});

function testA1VsC1Guidance() {
  assert.match(LEVEL_GUIDANCE.A1, /simple|short/i);
  assert.match(LEVEL_GUIDANCE.C1, /Sophisticated|complex|abstract/i);
  const a1 = buildTutorSystemPrompt({
    language: "es",
    level: "A1",
    nativeLanguage: "en",
    motivation: "travel",
  });
  const c1 = buildTutorSystemPrompt({
    language: "es",
    level: "C1",
    nativeLanguage: "en",
    motivation: "work",
  });
  assert.match(a1, /A1/);
  assert.match(a1, /travel/i);
  assert.match(c1, /C1/);
  assert.match(c1, /work|workplace/i);
  assert.notEqual(a1, c1);
}

function testNativeAndTargetInPrompt() {
  const prompt = buildTutorSystemPrompt({
    language: "fr",
    level: "B1",
    nativeLanguage: "de",
    motivation: "fun",
  });
  assert.match(prompt, /French|fr/);
  assert.match(prompt, /German|de|Native language/i);
  assert.match(prompt, /"reply"/);
}

function testRtlNote() {
  const ur = buildTutorSystemPrompt({
    language: "ur",
    level: "A2",
    nativeLanguage: "en",
  });
  assert.match(ur, /RTL|Urdu/i);
  const en = buildTutorSystemPrompt({
    language: "en",
    level: "A2",
    nativeLanguage: "es",
  });
  assert.doesNotMatch(en, /RTL/);
  assert.match(en, /Spanish/);
  assert.doesNotMatch(
    en,
    /Native language for explanations ONLY: English \(language code: en\)/,
  );
}

function testValidCorrectionFixture() {
  const ok = tutorResponseSchema.parse({
    reply: "¿Cómo estás?",
    correction: {
      original: "Yo soy bien",
      corrected: "Yo estoy bien",
      explanation: "Use estar for temporary states.",
    },
    vocabularySuggestions: [{ term: "estar", meaning: "to be (state)" }],
  });
  assert.equal(ok.correction?.corrected, "Yo estoy bien");
}

function testNullCorrectionFixture() {
  const ok = tutorResponseSchema.parse({
    reply: "Great job!",
    correction: null,
    vocabularySuggestions: [],
  });
  assert.equal(ok.correction, null);
}

function testInvalidAiFieldsRejected() {
  const bad = tutorResponseSchema.safeParse({
    reply: "",
    correction: null,
    vocabularySuggestions: [],
  });
  assert.equal(bad.success, false);

  const missing = tutorResponseSchema.safeParse({
    tutorReply: "legacy",
    correction: null,
  });
  assert.equal(missing.success, false);
}

function testJsonSchemaRequiresReply() {
  assert.ok(
    tutorResponseJsonSchema.schema.required.includes("reply"),
  );
  assert.ok(
    tutorResponseJsonSchema.schema.required.includes("vocabularySuggestions"),
  );
}

function testHistoricalNullSuggestions() {
  const parsed = tutorResponseSchema.parse({
    reply: "Hola",
    correction: null,
  });
  assert.deepEqual(parsed.vocabularySuggestions, []);
}

function testTopicGuidanceInPrompt() {
  const grammar = buildTutorSystemPrompt({
    language: "es",
    level: "A2",
    nativeLanguage: "en",
    motivation: "fun",
    topic: "grammar",
  });
  assert.match(grammar, /Practice topic: grammar/i);
  assert.match(grammar, /sentence structure|tenses|grammar/i);

  const travel = buildTutorSystemPrompt({
    language: "es",
    level: "A2",
    nativeLanguage: "en",
    motivation: "fun",
    topic: "travel",
    scenario: "Checking into a hotel",
  });
  assert.match(travel, /Practice topic: travel/i);
  assert.match(travel, /Session scenario: Checking into a hotel/);
  assert.match(travel, /airports|hotels|travel/i);
}

function testNullTopicLegacyBehavior() {
  const withNull = buildTutorSystemPrompt({
    language: "fr",
    level: "B1",
    nativeLanguage: "en",
    motivation: "travel",
    topic: null,
  });
  const without = buildTutorSystemPrompt({
    language: "fr",
    level: "B1",
    nativeLanguage: "en",
    motivation: "travel",
  });
  assert.match(withNull, /Practice topic: none specified/i);
  assert.match(withNull, /travel\/navigation/i);
  assert.equal(withNull, without);
}

testA1VsC1Guidance();
testNativeAndTargetInPrompt();
testRtlNote();
testValidCorrectionFixture();
testNullCorrectionFixture();
testInvalidAiFieldsRejected();
testJsonSchemaRequiresReply();
testHistoricalNullSuggestions();
testTopicGuidanceInPrompt();
testNullTopicLegacyBehavior();
console.log("prompts.test.ts: ok");
