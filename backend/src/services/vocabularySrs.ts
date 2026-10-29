/**
 * UTC-based spaced repetition (Again/Hard/Good/Easy). Pure — inject `now` for tests.
 *
 * Rating transitions (preserve unless a documented defect requires change):
 * - again: ease −0.2 (min 1.3), reps → 0, interval ~10 min, lapses += 1
 * - hard: ease −0.15, reps unchanged; intro 1h else max(1h, interval×1.2)
 * - good: ease unchanged; intro 1d / reps 0→1 else max(1, interval×ease) and reps += 1
 * - easy: ease +0.15; intro 4d / reps 0→1 else max(1, interval×ease×1.3) and reps += 1
 *
 * deriveState after every rating:
 * - mastered if intervalDays ≥ 21 and repetitions > 0
 * - else difficult if lapses ≥ 2
 * - else learning if repetitions === 0 or intervalDays < 1
 * - else review
 *
 * "new" is the DB create default only; applyVocabRating never returns "new".
 * Due: nextReviewAt == null or nextReviewAt <= now.
 */

import type { LearningState, VocabRating } from "../db/schema";

export type { LearningState, VocabRating };

export const VOCAB_RATINGS = ["again", "hard", "good", "easy"] as const satisfies readonly VocabRating[];

export const LEARNING_STATES = [
  "new",
  "learning",
  "review",
  "difficult",
  "mastered",
] as const satisfies readonly LearningState[];

export const MS_PER_DAY = 86_400_000;
export const MASTERED_INTERVAL_DAYS = 21;
export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

/** ~10 minutes */
export const AGAIN_INTERVAL_DAYS = 10 / 1440;
/** 1 hour */
export const HARD_INTRO_INTERVAL_DAYS = 1 / 24;

export type SrsCardInput = {
  learningState: LearningState;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
};

export type SrsCardResult = SrsCardInput & {
  nextReviewAt: Date;
  lastReviewedAt: Date;
};

function clampEase(ease: number): number {
  return Math.max(MIN_EASE, ease);
}

function deriveState(
  intervalDays: number,
  lapses: number,
  repetitions: number,
): LearningState {
  if (intervalDays >= MASTERED_INTERVAL_DAYS && repetitions > 0) {
    return "mastered";
  }
  if (lapses >= 2) return "difficult";
  if (repetitions === 0 || intervalDays < 1) return "learning";
  return "review";
}

function addInterval(now: Date, intervalDays: number): Date {
  return new Date(now.getTime() + intervalDays * MS_PER_DAY);
}

export function isDue(
  nextReviewAt: Date | null | undefined,
  now: Date,
): boolean {
  if (nextReviewAt == null) return true;
  return nextReviewAt.getTime() <= now.getTime();
}

export function applyVocabRating(
  card: SrsCardInput,
  rating: VocabRating,
  now: Date,
): SrsCardResult {
  let easeFactor = card.easeFactor > 0 ? card.easeFactor : DEFAULT_EASE;
  let intervalDays = card.intervalDays;
  let repetitions = card.repetitions;
  let lapses = card.lapses;

  switch (rating) {
    case "again": {
      lapses += 1;
      repetitions = 0;
      easeFactor = clampEase(easeFactor - 0.2);
      intervalDays = AGAIN_INTERVAL_DAYS;
      break;
    }
    case "hard": {
      easeFactor = clampEase(easeFactor - 0.15);
      if (repetitions === 0) {
        intervalDays = HARD_INTRO_INTERVAL_DAYS;
      } else {
        intervalDays = Math.max(
          HARD_INTRO_INTERVAL_DAYS,
          intervalDays * 1.2,
        );
      }
      break;
    }
    case "good": {
      if (repetitions === 0) {
        intervalDays = 1;
        repetitions = 1;
      } else {
        intervalDays = Math.max(1, intervalDays * easeFactor);
        repetitions += 1;
      }
      break;
    }
    case "easy": {
      easeFactor = easeFactor + 0.15;
      if (repetitions === 0) {
        intervalDays = 4;
        repetitions = 1;
      } else {
        intervalDays = Math.max(1, intervalDays * easeFactor * 1.3);
        repetitions += 1;
      }
      break;
    }
    default: {
      const _exhaustive: never = rating;
      throw new Error(`Unknown rating: ${_exhaustive}`);
    }
  }

  const learningState = deriveState(intervalDays, lapses, repetitions);
  return {
    learningState,
    easeFactor,
    intervalDays,
    repetitions,
    lapses,
    nextReviewAt: addInterval(now, intervalDays),
    lastReviewedAt: now,
  };
}

export function reviewPriority(state: LearningState): number {
  switch (state) {
    case "difficult":
      return 0;
    case "learning":
      return 1;
    case "new":
      return 2;
    case "review":
      return 3;
    case "mastered":
      return 4;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
