import assert from "node:assert/strict";
import {
  AGAIN_INTERVAL_DAYS,
  DEFAULT_EASE,
  HARD_INTRO_INTERVAL_DAYS,
  MASTERED_INTERVAL_DAYS,
  MIN_EASE,
  MS_PER_DAY,
  applyVocabRating,
  isDue,
  type SrsCardInput,
} from "./vocabularySrs";

const NOW = new Date("2026-06-15T12:00:00.000Z");

function freshCard(overrides: Partial<SrsCardInput> = {}): SrsCardInput {
  return {
    learningState: "new",
    easeFactor: DEFAULT_EASE,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    ...overrides,
  };
}

function testIntroGood() {
  const r = applyVocabRating(freshCard(), "good", NOW);
  assert.equal(r.intervalDays, 1);
  assert.equal(r.repetitions, 1);
  assert.equal(r.learningState, "review");
  assert.equal(r.nextReviewAt.toISOString(), "2026-06-16T12:00:00.000Z");
}

function testIntroEasy() {
  const r = applyVocabRating(freshCard(), "easy", NOW);
  assert.equal(r.intervalDays, 4);
  assert.equal(r.repetitions, 1);
  assert.equal(r.learningState, "review");
  assert.equal(
    r.nextReviewAt.getTime(),
    NOW.getTime() + 4 * MS_PER_DAY,
  );
}

function testAgainEaseFloor() {
  const r = applyVocabRating(
    freshCard({ easeFactor: MIN_EASE, lapses: 0 }),
    "again",
    NOW,
  );
  assert.equal(r.easeFactor, MIN_EASE);
  assert.equal(r.lapses, 1);
  assert.equal(r.repetitions, 0);
  assert.equal(r.intervalDays, AGAIN_INTERVAL_DAYS);
  assert.equal(r.learningState, "learning");
}

function testAgainDifficult() {
  const r = applyVocabRating(freshCard({ lapses: 1 }), "again", NOW);
  assert.equal(r.lapses, 2);
  assert.equal(r.learningState, "difficult");
}

function testHardIntro() {
  const r = applyVocabRating(freshCard(), "hard", NOW);
  assert.equal(r.intervalDays, HARD_INTRO_INTERVAL_DAYS);
  assert.equal(r.learningState, "learning");
}

function testHardMultiplier() {
  const r = applyVocabRating(
    freshCard({
      learningState: "review",
      intervalDays: 10,
      repetitions: 2,
      easeFactor: 2.5,
    }),
    "hard",
    NOW,
  );
  assert.equal(r.intervalDays, 12);
  assert.equal(r.easeFactor, 2.35);
  assert.equal(r.learningState, "review");
}

function testGoodMultiplier() {
  const r = applyVocabRating(
    freshCard({
      learningState: "review",
      intervalDays: 4,
      repetitions: 1,
      easeFactor: 2.5,
    }),
    "good",
    NOW,
  );
  assert.equal(r.intervalDays, 10);
  assert.equal(r.repetitions, 2);
  assert.equal(r.easeFactor, 2.5);
}

function testEasyMultiplier() {
  const r = applyVocabRating(
    freshCard({
      learningState: "review",
      intervalDays: 4,
      repetitions: 1,
      easeFactor: 2.5,
    }),
    "easy",
    NOW,
  );
  assert.equal(r.easeFactor, 2.65);
  assert.equal(r.intervalDays, 4 * 2.65 * 1.3);
  assert.equal(r.repetitions, 2);
}

function testMasteredThreshold() {
  const before = freshCard({
    learningState: "review",
    intervalDays: 10,
    repetitions: 3,
    easeFactor: 2.5,
  });
  const r = applyVocabRating(before, "good", NOW);
  assert.ok(r.intervalDays >= MASTERED_INTERVAL_DAYS);
  assert.equal(r.learningState, "mastered");
}

function testDueBoundary() {
  assert.equal(isDue(null, NOW), true);
  assert.equal(isDue(undefined, NOW), true);
  assert.equal(isDue(NOW, NOW), true);
  assert.equal(isDue(new Date(NOW.getTime() - 1), NOW), true);
  assert.equal(isDue(new Date(NOW.getTime() + 1), NOW), false);
}

function testMasteredNotFromAge() {
  const r = applyVocabRating(freshCard(), "good", NOW);
  assert.notEqual(r.learningState, "mastered");
}

function testHardOnlyStaysLearning() {
  const r = applyVocabRating(freshCard({ repetitions: 0 }), "hard", NOW);
  assert.equal(r.repetitions, 0);
  assert.equal(r.learningState, "learning");
}

function testDifficultStickyUntilMastered() {
  const mid = applyVocabRating(
    freshCard({
      learningState: "difficult",
      lapses: 2,
      repetitions: 2,
      intervalDays: 5,
      easeFactor: 2.5,
    }),
    "good",
    NOW,
  );
  assert.equal(mid.lapses, 2);
  assert.equal(mid.learningState, "difficult");

  const mastered = applyVocabRating(
    {
      learningState: "difficult",
      lapses: 2,
      repetitions: 3,
      intervalDays: 20,
      easeFactor: 2.5,
    },
    "good",
    NOW,
  );
  assert.ok(mastered.intervalDays >= MASTERED_INTERVAL_DAYS);
  assert.equal(mastered.learningState, "mastered");
}

const tests = [
  testIntroGood,
  testIntroEasy,
  testAgainEaseFloor,
  testAgainDifficult,
  testHardIntro,
  testHardMultiplier,
  testGoodMultiplier,
  testEasyMultiplier,
  testMasteredThreshold,
  testDueBoundary,
  testMasteredNotFromAge,
  testHardOnlyStaysLearning,
  testDifficultStickyUntilMastered,
];

for (const t of tests) t();
console.log(`vocabularySrs.test.ts: ${tests.length} passed`);
