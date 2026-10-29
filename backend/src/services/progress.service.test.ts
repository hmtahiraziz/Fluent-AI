import assert from "node:assert/strict";
import { computeReviewSuccessRate } from "./progress.service";
import { REVIEW_SUCCESS_RATINGS } from "./progressTime";

assert.equal(computeReviewSuccessRate(7, 10), 0.7);
assert.equal(computeReviewSuccessRate(0, 0), null);
assert.equal(computeReviewSuccessRate(0, 5), 0);

assert.equal(REVIEW_SUCCESS_RATINGS.has("good"), true);
assert.equal(REVIEW_SUCCESS_RATINGS.has("easy"), true);
assert.equal(REVIEW_SUCCESS_RATINGS.has("again"), false);
assert.equal(REVIEW_SUCCESS_RATINGS.has("hard"), false);

console.log("progress.service.test.ts: ok");
