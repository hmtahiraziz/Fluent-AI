/**
 * Escape a user search string for PostgreSQL ILIKE with ESCAPE '\'.
 * After escaping, `%`, `_`, and `\` match literally when used with ESCAPE '\'.
 */
export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Returns null when search should be skipped (empty / whitespace-only). */
export function buildIlikeContainsPattern(q: string): string | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  return `%${escapeIlikePattern(trimmed)}%`;
}
