import assert from "node:assert/strict";
import {
  clampHistoryLimit,
  selectChronologicalHistory,
  selectNewestMessagesChronological,
} from "./chatHistory";

function testClamp() {
  assert.equal(clampHistoryLimit(undefined), 20);
  assert.equal(clampHistoryLimit(2), 5);
  assert.equal(clampHistoryLimit(100), 50);
  assert.equal(clampHistoryLimit(15), 15);
}

function testChronologicalNewestFirst() {
  const rows = [
    { id: "3", role: "assistant", content: "c", createdAt: "2026-01-03" },
    { id: "2", role: "user", content: "b", createdAt: "2026-01-02" },
    { id: "1", role: "assistant", content: "a", createdAt: "2026-01-01" },
  ];
  const history = selectChronologicalHistory(rows, 2);
  assert.deepEqual(history, [
    { role: "user", content: "b" },
    { role: "assistant", content: "c" },
  ]);
}

function testIgnoresOtherRoles() {
  const rows = [
    { id: "2", role: "system", content: "x", createdAt: "2026-01-02" },
    { id: "1", role: "user", content: "hi", createdAt: "2026-01-01" },
  ];
  const history = selectChronologicalHistory(rows, 10);
  assert.deepEqual(history, [{ role: "user", content: "hi" }]);
}

function testListMessagesNewestWindowNotOldestTruncation() {
  // Simulate DESC newest-first fetch of limit=3 from a longer chat.
  const newestFirst = [
    { id: "10", role: "user", content: "newest", createdAt: "2026-01-10" },
    { id: "9", role: "assistant", content: "n-1", createdAt: "2026-01-09" },
    { id: "8", role: "user", content: "n-2", createdAt: "2026-01-08" },
  ];
  const chron = selectNewestMessagesChronological(newestFirst, 3);
  assert.deepEqual(
    chron.map((m) => m.id),
    ["8", "9", "10"],
  );
  // Old bug: ASC + LIMIT would have returned ids 1..3 and dropped 10.
  assert.equal(chron[chron.length - 1]?.content, "newest");
}

testClamp();
testChronologicalNewestFirst();
testIgnoresOtherRoles();
testListMessagesNewestWindowNotOldestTruncation();
console.log("chatHistory.test.ts: ok");
