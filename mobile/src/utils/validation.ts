import { ApiError } from "../services/apiClient.ts";

export const MAX_PG_INT = 2_147_483_647;

const FORBIDDEN_RECORD_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function hasSafeOwnKey<T extends object>(
  obj: T,
  key: PropertyKey,
): boolean {
  return (
    Object.prototype.hasOwnProperty.call(obj, key) &&
    !FORBIDDEN_RECORD_KEYS.has(String(key))
  );
}

export function expectRecord(
  raw: unknown,
  label: string,
): Record<string, unknown> {
  if (!isRecord(raw)) {
    throw new ApiError(
      `Invalid ${label} response from server.`,
      0,
      "invalid_response",
    );
  }
  return raw;
}

export function parsePositiveIntId(raw: unknown, label: string): string {
  if (
    typeof raw !== "number" ||
    !Number.isSafeInteger(raw) ||
    raw <= 0 ||
    raw > MAX_PG_INT
  ) {
    throw new ApiError(
      `Invalid ${label} identifier received from server.`,
      0,
      "invalid_response",
    );
  }
  return String(raw);
}

export function parsePositiveInt(
  raw: unknown,
  label: string,
  max = MAX_PG_INT,
): number {
  if (
    typeof raw !== "number" ||
    !Number.isSafeInteger(raw) ||
    raw <= 0 ||
    raw > max
  ) {
    throw new ApiError(
      `Invalid ${label} received from server.`,
      0,
      "invalid_response",
    );
  }
  return raw;
}

export function parseNonNegativeInt(
  raw: unknown,
  label: string,
  max = MAX_PG_INT,
): number {
  if (
    typeof raw !== "number" ||
    !Number.isSafeInteger(raw) ||
    raw < 0 ||
    raw > max
  ) {
    throw new ApiError(
      `Invalid ${label} received from server.`,
      0,
      "invalid_response",
    );
  }
  return raw;
}

export function parseStringField(
  raw: unknown,
  label: string,
  requireNonEmpty = false,
): string {
  if (typeof raw !== "string") {
    throw new ApiError(
      `Invalid ${label} received from server.`,
      0,
      "invalid_response",
    );
  }
  if (requireNonEmpty && !raw.trim()) {
    throw new ApiError(
      `Invalid ${label} received from server.`,
      0,
      "invalid_response",
    );
  }
  return raw;
}

export function parseBooleanField(raw: unknown, label: string): boolean {
  if (typeof raw !== "boolean") {
    throw new ApiError(
      `Invalid ${label} received from server.`,
      0,
      "invalid_response",
    );
  }
  return raw;
}

export function normalizeIndianPhone(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new ApiError("Valid 10-digit Indian mobile number is required.", 400, "validation");
  }
  const cleaned = raw.trim().replace(/[^\d+]/g, "");
  let national = cleaned;

  if (cleaned.startsWith("+91")) {
    national = cleaned.slice(3);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    national = cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    national = cleaned.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(national)) {
    throw new ApiError("Valid 10-digit Indian mobile number is required.", 400, "validation");
  }
  return `+91${national}`;
}
