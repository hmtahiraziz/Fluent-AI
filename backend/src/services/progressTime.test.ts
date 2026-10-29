import assert from "node:assert/strict";
import {
  assertValidTimeZone,
  formatDateInTimeZone,
  isValidLocalDateKey,
  lastNLocalDays,
  startOfZonedDayUtc,
  endOfZonedDayUtc,
} from "./progressTime";

assertValidTimeZone("Asia/Karachi");
assertValidTimeZone("UTC");
assert.throws(() => assertValidTimeZone("Not/AZone"), /INVALID_TIMEZONE/);

assert.equal(isValidLocalDateKey("2026-03-15"), true);
assert.equal(isValidLocalDateKey("2026-13-01"), false);
assert.equal(isValidLocalDateKey("26-03-15"), false);

// Pakistan UTC+5: local 2026-06-15 00:00 = 2026-06-14 19:00 UTC
const pkStart = startOfZonedDayUtc("2026-06-15", "Asia/Karachi");
assert.equal(pkStart.toISOString(), "2026-06-14T19:00:00.000Z");
const pkEnd = endOfZonedDayUtc("2026-06-15", "Asia/Karachi");
assert.equal(pkEnd.toISOString(), "2026-06-15T19:00:00.000Z");

// A review just after Pakistan midnight belongs to 2026-06-15
const justAfterMidnightPk = new Date("2026-06-14T19:05:00.000Z");
assert.equal(formatDateInTimeZone(justAfterMidnightPk, "Asia/Karachi"), "2026-06-15");
assert.equal(formatDateInTimeZone(justAfterMidnightPk, "UTC"), "2026-06-14");

const days = lastNLocalDays("UTC", 7, new Date("2026-06-15T12:00:00.000Z"));
assert.equal(days.length, 7);
assert.equal(days[6], "2026-06-15");
assert.equal(days[0], "2026-06-09");

console.log("progressTime.test.ts: ok");
