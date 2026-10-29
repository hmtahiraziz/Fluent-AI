/**
 * Shared phrase normalization for vocabulary create + migration uniqueness.
 * - trim ends
 * - collapse internal whitespace to a single space
 * - phraseKey is lower(phrase) after normalize
 */
export function normalizeVocabularyPhrase(raw: string): {
  phrase: string;
  phraseKey: string;
} {
  const phrase = raw.trim().replace(/\s+/g, " ");
  const phraseKey = phrase.toLowerCase();
  return { phrase, phraseKey };
}

export type VocabDuplicateCandidate = {
  id: string;
  userId: string;
  language: string;
  phrase: string;
  phraseKey: string;
  translation: string | null;
  note: string | null;
  sourceMessageId: string | null;
  createdAt: Date | string;
};

/**
 * Pure helper: group duplicates and pick keeper (earliest createdAt, then lowest id).
 * Does not delete — used by tests and migration planning.
 */
export function planVocabularyDuplicateMerges(
  rows: VocabDuplicateCandidate[],
): Array<{
  keeperId: string;
  loserIds: string[];
  groupKey: string;
}> {
  const groups = new Map<string, VocabDuplicateCandidate[]>();
  for (const row of rows) {
    const key = `${row.userId}\0${row.language}\0${row.phraseKey}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const plans: Array<{
    keeperId: string;
    loserIds: string[];
    groupKey: string;
  }> = [];

  for (const [groupKey, list] of groups) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
    const keeper = sorted[0]!;
    plans.push({
      keeperId: keeper.id,
      loserIds: sorted.slice(1).map((r) => r.id),
      groupKey,
    });
  }
  return plans;
}

/** Merge null-only fields from loser onto keeper (non-destructive for non-null keeper fields). */
export function mergeVocabFieldsOntoKeeper<
  T extends {
    translation: string | null;
    note: string | null;
    sourceMessageId: string | null;
    pronunciation?: string | null;
    exampleSentence?: string | null;
  },
>(keeper: T, loser: T): T {
  const next: T = {
    ...keeper,
    translation: keeper.translation ?? loser.translation,
    note: keeper.note ?? loser.note,
    sourceMessageId: keeper.sourceMessageId ?? loser.sourceMessageId,
  };
  if ("pronunciation" in keeper || "pronunciation" in loser) {
    next.pronunciation = keeper.pronunciation ?? loser.pronunciation ?? null;
  }
  if ("exampleSentence" in keeper || "exampleSentence" in loser) {
    next.exampleSentence =
      keeper.exampleSentence ?? loser.exampleSentence ?? null;
  }
  return next;
}
