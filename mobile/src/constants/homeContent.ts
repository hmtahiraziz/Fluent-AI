export const LEARNING_TIPS = [
  'Try practicing right before bed to boost memory retention.',
  'Say new phrases out loud — speaking helps lock in vocabulary.',
  'Review three saved words before each chat session.',
  'Short daily practice beats long weekend cramming.',
  'When corrected, rewrite the sentence once in your own words.',
  'Ask the tutor to slow down or simplify if a reply feels too hard.',
] as const;

/** Deterministic tip for a local calendar day (YYYY-MM-DD). */
export function learningTipForDay(dayKey: string): string {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) {
    h = (h * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return LEARNING_TIPS[h % LEARNING_TIPS.length]!;
}

/** @deprecated use LEARNING_TIPS / learningTipForDay */
export const LEARNING_TIP = LEARNING_TIPS[0]!;
