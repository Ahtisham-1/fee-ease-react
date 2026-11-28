import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "../src/services/apiClient";
import {
  formatPhoneOtpError,
  isActiveOtpConflictError,
  PHONE_OTP_COOLDOWN_SECONDS,
  sanitizeOtpCodeInput,
  sanitizePhoneInput,
} from "../src/utils/phoneOtpHelpers";

test("phoneOtpHelpers sanitizes phone and 6-digit OTP inputs cleanly", () => {
  assert.equal(PHONE_OTP_COOLDOWN_SECONDS, 60);
  assert.equal(sanitizePhoneInput("+91 98765-43210abc!"), "+91 98765-43210");
  assert.equal(sanitizePhoneInput("  +91 98765 - 43210"), "+91 98765 - 43210");
  assert.equal(sanitizePhoneInput("+919876543210".repeat(3)).length, 24);
  assert.equal(sanitizeOtpCodeInput("12a3-4b5678"), "123456");
});

test("isActiveOtpConflictError detects 429 OTP active/cooldown conflicts without matching IP rate limit", () => {
  assert.equal(
    isActiveOtpConflictError(
      new ApiError("Please wait until the current otp expires", 429),
    ),
    true,
  );
  assert.equal(
    isActiveOtpConflictError(
      new ApiError("Please wait before requesting another OTP", 429),
    ),
    true,
  );
  assert.equal(
    isActiveOtpConflictError(
      new ApiError("Too many OTP requests. Please try again later", 429),
    ),
    false,
  );
  assert.equal(
    isActiveOtpConflictError(
      new ApiError("Please wait until the current otp expires", 400),
    ),
    false,
  );
  assert.equal(isActiveOtpConflictError(new Error("random")), false);
});

test("formatPhoneOtpError preserves critical backend messages and enhances generic failures", () => {
  assert.equal(
    formatPhoneOtpError(
      new ApiError("Please wait before requesting another OTP", 429),
      "fallback",
    ),
    "Please wait before requesting another OTP",
  );
  assert.equal(
    formatPhoneOtpError(
      new ApiError("Too many failed attempts. This code is locked", 429),
      "fallback",
    ),
    "Too many failed attempts. This code is locked",
  );
  assert.equal(
    formatPhoneOtpError(
      new ApiError("Parent account already linked to this user", 400),
      "fallback",
    ),
    "Parent account already linked to this user",
  );

  const verificationFailed = formatPhoneOtpError(
    new ApiError("Verification failed", 400),
    "fallback",
  );
  assert.match(verificationFailed, /Verification failed/i);
  assert.match(verificationFailed, /school/i);

  assert.equal(formatPhoneOtpError("unexpected", "Fallback text"), "Fallback text");
});
