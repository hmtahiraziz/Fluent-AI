import assert from "node:assert/strict";
import {
  cursorFromItem,
  decodeVocabCursor,
  encodeVocabCursor,
  itemIsAfterCursor,
  type VocabSort,
} from "./vocabularyCursor";

type Item = {
  id: string;
  createdAt: string;
  phrase: string;
  nextReviewAt: string | null;
};

function pageAll(
  sort: VocabSort,
  items: Item[],
  limit: number,
): string[] {
  const ordered = [...items].sort((a, b) => {
    if (sort === "created_at") {
      if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    }
    if (sort === "phrase") {
      if (a.phrase !== b.phrase) return a.phrase < b.phrase ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    }
    const an = a.nextReviewAt == null;
    const bn = b.nextReviewAt == null;
    if (an !== bn) return an ? -1 : 1;
    if (a.nextReviewAt !== b.nextReviewAt) {
      return (a.nextReviewAt ?? "") < (b.nextReviewAt ?? "") ? -1 : 1;
    }
    return a.id < b.id ? -1 : 1;
  });

  const seen: string[] = [];
  let cursor: string | undefined;
  for (;;) {
    const payload = cursor
      ? decodeVocabCursor(cursor, sort)
      : null;
    const page = ordered
      .filter((it) => (payload ? itemIsAfterCursor(sort, payload, it) : true))
      .slice(0, limit);
    for (const it of page) seen.push(it.id);
    if (page.length < limit) break;
    cursor = cursorFromItem(sort, page[page.length - 1]!);
  }
  return seen;
}

function testRoundTrip() {
  const enc = encodeVocabCursor({
    s: "phrase",
    k: "hola",
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    n: false,
  });
  const dec = decodeVocabCursor(enc, "phrase");
  assert.equal(dec.k, "hola");
  assert.equal(dec.n, false);
}

function testSortMismatch() {
  const enc = encodeVocabCursor({
    s: "created_at",
    k: "2026-01-01T00:00:00.000Z",
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    n: false,
  });
  assert.throws(() => decodeVocabCursor(enc, "phrase"), /sort mismatch/i);
}

function testCreatedAtPagingNoDupes() {
  const items: Item[] = [
    { id: "b", createdAt: "2026-01-02T00:00:00.000Z", phrase: "b", nextReviewAt: null },
    { id: "a", createdAt: "2026-01-02T00:00:00.000Z", phrase: "a", nextReviewAt: null },
    { id: "c", createdAt: "2026-01-01T00:00:00.000Z", phrase: "c", nextReviewAt: null },
  ];
  const seen = pageAll("created_at", items, 1);
  assert.deepEqual(seen.sort(), ["a", "b", "c"]);
  assert.equal(seen.length, 3);
}

function testPhrasePaging() {
  const items: Item[] = [
    { id: "2", createdAt: "2026-01-01T00:00:00.000Z", phrase: "beta", nextReviewAt: null },
    { id: "1", createdAt: "2026-01-01T00:00:00.000Z", phrase: "alpha", nextReviewAt: null },
    { id: "3", createdAt: "2026-01-01T00:00:00.000Z", phrase: "alpha", nextReviewAt: null },
  ];
  const seen = pageAll("phrase", items, 2);
  assert.deepEqual(seen, ["1", "3", "2"]);
}

function testNextReviewNulls() {
  const items: Item[] = [
    { id: "n2", createdAt: "2026-01-01T00:00:00.000Z", phrase: "x", nextReviewAt: null },
    { id: "n1", createdAt: "2026-01-01T00:00:00.000Z", phrase: "x", nextReviewAt: null },
    {
      id: "d1",
      createdAt: "2026-01-01T00:00:00.000Z",
      phrase: "x",
      nextReviewAt: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "d2",
      createdAt: "2026-01-01T00:00:00.000Z",
      phrase: "x",
      nextReviewAt: "2026-06-01T00:00:00.000Z",
    },
  ];
  const seen = pageAll("next_review_at", items, 1);
  assert.deepEqual(seen, ["n1", "n2", "d1", "d2"]);
}

const tests = [
  testRoundTrip,
  testSortMismatch,
  testCreatedAtPagingNoDupes,
  testPhrasePaging,
  testNextReviewNulls,
];
for (const t of tests) t();
console.log(`vocabularyCursor.test.ts: ${tests.length} passed`);
