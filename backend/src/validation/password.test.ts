import assert from "node:assert/strict";
import { passwordSchema } from "./password";

const short = passwordSchema.safeParse("short");
assert.equal(short.success, false);

const ok = passwordSchema.safeParse("longenough");
assert.equal(ok.success, true);

const huge = passwordSchema.safeParse("x".repeat(129));
assert.equal(huge.success, false);

console.log("passwordSchema tests passed");
