/**
 * Deterministic conversation history window for the tutor model.
 * Newest-first fetch, then reverse to chronological order.
 */
export function clampHistoryLimit(
  raw: number | undefined,
  fallback = 20,
): number {
  const n = raw ?? fallback;
  return Math.min(50, Math.max(5, Math.floor(n)));
}

export type HistoryRow = {
  id: string;
  role: string;
  content: string;
  createdAt: Date | string;
};

/**
 * Given rows already ordered newest-first (DESC by createdAt, then id),
 * return up to `limit` turns in chronological ASC order for the model.
 */
export function selectChronologicalHistory(
  newestFirstRows: HistoryRow[],
  limit: number,
): { role: "user" | "assistant"; content: string }[] {
  const capped = newestFirstRows.slice(0, limit);
  const chronological = [...capped].reverse();
  return chronological
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

/**
 * UI listMessages helper: newest-first fetch of `limit` rows → chronological ASC.
 * Regression: oldest-first + LIMIT previously dropped the newest turns in long chats.
 */
export function selectNewestMessagesChronological<T extends HistoryRow>(
  newestFirstRows: T[],
  limit: number,
): T[] {
  return [...newestFirstRows.slice(0, limit)].reverse();
}
