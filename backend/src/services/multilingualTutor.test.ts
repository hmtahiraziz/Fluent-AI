import assert from "node:assert/strict";
import type { CefrLevel } from "../constants/languages";
import {
  LEVEL_GUIDANCE,
  buildTutorSystemPrompt,
  resolveNativeLanguageLabel,
  writingSystemGuidance,
} from "./prompts";

type Pair = {
  id: string;
  target: string;
  native: string;
  level: CefrLevel;
  motivation: string;
  expectScriptHint: RegExp;
  expectNativeLabel: RegExp;
  expectTargetLabel: RegExp;
};

const PAIRS: Pair[] = [
  {
    id: "ko-en",
    target: "ko",
    native: "en",
    level: "A1",
    motivation: "travel",
    expectScriptHint: /Hangul|한글/,
    expectNativeLabel: /English/,
    expectTargetLabel: /Korean/,
  },
  {
    id: "ja-es",
    target: "ja",
    native: "es",
    level: "A1",
    motivation: "fun",
    expectScriptHint: /Japanese|kanji|hiragana/i,
    expectNativeLabel: /Spanish/,
    expectTargetLabel: /Japanese/,
  },
  {
    id: "es-ko",
    target: "es",
    native: "ko",
    level: "C1",
    motivation: "work",
    expectScriptHint: /Spanish|orthography|es/,
    expectNativeLabel: /Korean/,
    expectTargetLabel: /Spanish/,
  },
  {
    id: "ar-fr",
    target: "ar",
    native: "fr",
    level: "A2",
    motivation: "family",
    expectScriptHint: /Arabic|RTL/i,
    expectNativeLabel: /French/,
    expectTargetLabel: /Arabic/,
  },
  {
    id: "ur-hi",
    target: "ur",
    native: "hi",
    level: "B1",
    motivation: "school",
    expectScriptHint: /Urdu|RTL/i,
    expectNativeLabel: /Hindi/,
    expectTargetLabel: /Urdu/,
  },
];

function testNeverAssumeEnglishNative() {
  assert.equal(
    resolveNativeLanguageLabel(undefined),
    "the learner's native language",
  );
  assert.equal(resolveNativeLanguageLabel("ko"), "Korean");
  const prompt = buildTutorSystemPrompt({
    language: "es",
    level: "A1",
  });
  assert.doesNotMatch(
    prompt,
    /Native language for explanations ONLY: English \(language code: en\)/,
  );
  assert.match(prompt, /learner's native language/i);
}

function testWritingSystems() {
  assert.match(writingSystemGuidance("ko"), /Hangul|한글/);
  assert.match(writingSystemGuidance("ja"), /kanji|hiragana|katakana/i);
  assert.match(writingSystemGuidance("ar"), /RTL|Arabic/i);
  assert.match(writingSystemGuidance("zh"), /Chinese/);
  assert.match(writingSystemGuidance("hi"), /Devanagari|हिन्दी/);
  assert.match(writingSystemGuidance("ru"), /Cyrillic/);
}

function testLanguagePairs() {
  for (const pair of PAIRS) {
    const prompt = buildTutorSystemPrompt({
      language: pair.target,
      level: pair.level,
      nativeLanguage: pair.native,
      motivation: pair.motivation,
    });
    assert.match(prompt, pair.expectTargetLabel, `${pair.id} target`);
    assert.match(prompt, pair.expectNativeLabel, `${pair.id} native`);
    assert.match(prompt, pair.expectScriptHint, `${pair.id} script`);
    assert.match(prompt, /"reply" MUST be written entirely/i, `${pair.id} reply`);
    assert.match(
      prompt,
      new RegExp(`explanation.*MUST be written in ${pair.expectNativeLabel.source}`),
      `${pair.id} explanation language`,
    );
    assert.match(prompt, new RegExp(LEVEL_GUIDANCE[pair.level].slice(0, 24)));
    assert.match(prompt, /"vocabularySuggestions"/);
    assert.match(prompt, /"correction"/);
    assert.match(
      prompt,
      new RegExp(`term.*MUST be in ${pair.expectTargetLabel.source}|MUST be in`),
    );
  }
}

function testCefrAdaptationDiffers() {
  const a1 = buildTutorSystemPrompt({
    language: "ko",
    level: "A1",
    nativeLanguage: "en",
  });
  const c1 = buildTutorSystemPrompt({
    language: "ko",
    level: "C1",
    nativeLanguage: "en",
  });
  assert.match(a1, /A1/);
  assert.match(c1, /C1/);
  assert.notEqual(a1, c1);
  assert.match(a1, /simple|short/i);
  assert.match(c1, /Sophisticated|complex|abstract/i);
}

function testMotivationPersonalization() {
  const travel = buildTutorSystemPrompt({
    language: "ja",
    level: "B1",
    nativeLanguage: "en",
    motivation: "travel",
  });
  const work = buildTutorSystemPrompt({
    language: "ja",
    level: "B1",
    nativeLanguage: "en",
    motivation: "work",
  });
  assert.match(travel, /travel/i);
  assert.match(work, /work|workplace|professional/i);
}

function testStructuredContractMentions() {
  const prompt = buildTutorSystemPrompt({
    language: "ko",
    level: "A1",
    nativeLanguage: "es",
  });
  assert.match(prompt, /term.*MUST be in Korean/i);
  assert.match(prompt, /meaning.*MUST be a short gloss in Spanish/i);
}

testNeverAssumeEnglishNative();
testWritingSystems();
testLanguagePairs();
testCefrAdaptationDiffers();
testMotivationPersonalization();
testStructuredContractMentions();
console.log("multilingualTutor.test.ts: ok");
