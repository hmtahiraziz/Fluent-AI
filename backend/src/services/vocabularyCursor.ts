import { AppError } from "../middleware/errorHandler";

export const VOCAB_SORTS = ["created_at", "phrase", "next_review_at"] as const;
export type VocabSort = (typeof VOCAB_SORTS)[number];

export type VocabCursorPayload = {
  s: VocabSort;
  /** Sort key: ISO timestamp or phrase; null when next_review_at NULL group */
  k: string | null;
  id: string;
  /** True when cursor is in the NULL next_review_at group */
  n: boolean;
};

export function encodeVocabCursor(payload: VocabCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeVocabCursor(
  raw: string,
  expectedSort: VocabSort,
): VocabCursorPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    throw new AppError(400, "Invalid cursor");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("s" in parsed) ||
    !("id" in parsed)
  ) {
    throw new AppError(400, "Invalid cursor");
  }
  const p = parsed as Partial<VocabCursorPayload>;
  if (p.s !== expectedSort) {
    throw new AppError(400, "Cursor sort mismatch");
  }
  if (typeof p.id !== "string" || !p.id) {
    throw new AppError(400, "Invalid cursor");
  }
  const n = Boolean(p.n);
  const k = p.k == null ? null : String(p.k);
  if (expectedSort === "next_review_at") {
    if (n && k != null) throw new AppError(400, "Invalid cursor");
    if (!n && (k == null || Number.isNaN(Date.parse(k)))) {
      throw new AppError(400, "Invalid cursor");
    }
  } else if (k == null) {
    throw new AppError(400, "Invalid cursor");
  } else if (
    expectedSort === "created_at" &&
    Number.isNaN(Date.parse(k))
  ) {
    throw new AppError(400, "Invalid cursor");
  }
  return { s: expectedSort, k, id: p.id, n };
}

export function cursorFromItem(
  sort: VocabSort,
  item: {
    id: string;
    createdAt: Date | string;
    phrase: string;
    nextReviewAt: Date | string | null;
  },
): string {
  if (sort === "created_at") {
    const createdAt =
      item.createdAt instanceof Date
        ? item.createdAt.toISOString()
        : new Date(item.createdAt).toISOString();
    return encodeVocabCursor({
      s: sort,
      k: createdAt,
      id: item.id,
      n: false,
    });
  }
  if (sort === "phrase") {
    return encodeVocabCursor({
      s: sort,
      k: item.phrase,
      id: item.id,
      n: false,
    });
  }
  if (item.nextReviewAt == null) {
    return encodeVocabCursor({ s: sort, k: null, id: item.id, n: true });
  }
  const next =
    item.nextReviewAt instanceof Date
      ? item.nextReviewAt.toISOString()
      : new Date(item.nextReviewAt).toISOString();
  return encodeVocabCursor({ s: sort, k: next, id: item.id, n: false });
}

/** Pure predicate for tests: whether `item` is strictly after `cursor` in sort order. */
export function itemIsAfterCursor(
  sort: VocabSort,
  cursor: VocabCursorPayload,
  item: {
    id: string;
    createdAt: Date | string;
    phrase: string;
    nextReviewAt: Date | string | null;
  },
): boolean {
  if (sort === "created_at") {
    const ca = new Date(item.createdAt).toISOString();
    const ck = cursor.k!;
    return ca < ck || (ca === ck && item.id < cursor.id);
  }
  if (sort === "phrase") {
    const pk = cursor.k!;
    return (
      item.phrase > pk || (item.phrase === pk && item.id > cursor.id)
    );
  }
  // next_review_at NULLS FIRST, then ASC, id ASC
  const itemNull = item.nextReviewAt == null;
  if (cursor.n) {
    if (itemNull) return item.id > cursor.id;
    return true;
  }
  if (itemNull || item.nextReviewAt == null) return false;
  const nr = item.nextReviewAt;
  const it = nr instanceof Date ? nr.toISOString() : new Date(nr).toISOString();
  const ck = cursor.k!;
  return it > ck || (it === ck && item.id > cursor.id);
}
