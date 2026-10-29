import assert from "node:assert/strict";
import {
  buildIlikeContainsPattern,
  escapeIlikePattern,
} from "./vocabularySearch";

assert.equal(escapeIlikePattern("100%"), "100\\%");
assert.equal(escapeIlikePattern("under_score"), "under\\_score");
assert.equal(escapeIlikePattern("a\\b"), "a\\\\b");
assert.equal(escapeIlikePattern("100%_\\x"), "100\\%\\_\\\\x");

assert.equal(buildIlikeContainsPattern(""), null);
assert.equal(buildIlikeContainsPattern("   "), null);
assert.equal(buildIlikeContainsPattern("hello"), "%hello%");
assert.equal(buildIlikeContainsPattern("  100%  "), "%100\\%%");
assert.equal(buildIlikeContainsPattern("under_score"), "%under\\_score%");
assert.equal(buildIlikeContainsPattern("a\\b"), "%a\\\\b%");

console.log("vocabularySearch.test.ts: ok");
