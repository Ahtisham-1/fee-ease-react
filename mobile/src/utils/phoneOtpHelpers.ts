import { ApiError } from "../services/apiClient";

export const PHONE_OTP_COOLDOWN_SECONDS = 60;

export function sanitizePhoneInput(raw: string): string {
  return raw
    .replace(/[^\d+\s-]/g, "")
    .trimStart()
    .slice(0, 24);
}

export function sanitizeOtpCodeInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export function isActiveOtpConflictError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 429 &&
    (/wait until the current otp expires/i.test(error.message) ||
      /wait before requesting another otp/i.test(error.message))
  );
}

export function formatPhoneOtpError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.message === "Verification failed") {
      return "Verification failed — no matching parent record was found for this phone number. Please confirm your registered number with the school office.";
    }
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
