import assert from "node:assert/strict";
import {
  generateSixDigitOtp,
  hashOtp,
  isSixDigitOtp,
  verifyOtpHash,
} from "./tokenHash";

const secret = "test-otp-secret-at-least-32-characters!!";
const userId = "11111111-2222-3333-4444-555555555555";

// Generation
for (let i = 0; i < 50; i++) {
  const code = generateSixDigitOtp();
  assert.equal(isSixDigitOtp(code), true, `expected six digits, got ${code}`);
}

assert.equal(isSixDigitOtp("12345"), false);
assert.equal(isSixDigitOtp("1234567"), false);
assert.equal(isSixDigitOtp("12ab56"), false);

// Hash + verify
const code = "482913";
const digest = hashOtp(secret, userId, code);
assert.equal(verifyOtpHash(secret, userId, code, digest), true);
assert.equal(verifyOtpHash(secret, userId, "000000", digest), false);
assert.equal(verifyOtpHash(secret, "other-user", code, digest), false);
assert.equal(verifyOtpHash("wrong-secret-at-least-32-characters!", userId, code, digest), false);

// Same inputs → same HMAC
assert.equal(hashOtp(secret, userId, code), digest);

console.log("tokenHash / OTP tests passed");
