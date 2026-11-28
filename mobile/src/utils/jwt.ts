import type { Role } from "../types/index.ts";

export interface JwtPayload {
  sub?: string;
  role?: string;
  exp?: number;
}

export interface SessionInspection {
  valid: boolean;
  expired: boolean;
  role: Role | null;
  email: string | null;
}

const MAX_JWT_LENGTH = 8192;
const BASE64URL_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;
const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function decodeBase64UrlBytes(segment: string): Uint8Array | null {
  if (!segment || !BASE64URL_SEGMENT_PATTERN.test(segment)) {
    return null;
  }

  const padded = segment
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(segment.length / 4) * 4, "=");

  if (padded.length % 4 !== 0) {
    return null;
  }

  const outputLength =
    (padded.length / 4) * 3 -
    (padded.endsWith("==") ? 2 : padded.endsWith("=") ? 1 : 0);
  const bytes = new Uint8Array(outputLength);
  let byteIndex = 0;

  for (let i = 0; i < padded.length; i += 4) {
    const c1 = BASE64_ALPHABET.indexOf(padded[i]);
    const c2 = BASE64_ALPHABET.indexOf(padded[i + 1]);
    const c3 = padded[i + 2] === "=" ? 0 : BASE64_ALPHABET.indexOf(padded[i + 2]);
    const c4 = padded[i + 3] === "=" ? 0 : BASE64_ALPHABET.indexOf(padded[i + 3]);

    if (c1 < 0 || c2 < 0 || c3 < 0 || c4 < 0) {
      return null;
    }

    const combined = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
    if (byteIndex < outputLength) bytes[byteIndex++] = (combined >> 16) & 0xff;
    if (byteIndex < outputLength) bytes[byteIndex++] = (combined >> 8) & 0xff;
    if (byteIndex < outputLength) bytes[byteIndex++] = combined & 0xff;
  }

  return bytes;
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > MAX_JWT_LENGTH
  ) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return null;
  }

  // Ensure header and signature are well-formed base64url tokens too.
  if (
    !BASE64URL_SEGMENT_PATTERN.test(parts[0]) ||
    !BASE64URL_SEGMENT_PATTERN.test(parts[2])
  ) {
    return null;
  }

  const payloadBytes = decodeBase64UrlBytes(parts[1]);
  if (!payloadBytes) {
    return null;
  }

  const jsonText = decodeUtf8(payloadBytes);
  if (!jsonText) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const payload: JwtPayload = {};
  if (typeof parsed.sub === "string" && parsed.sub.trim()) {
    payload.sub = parsed.sub.trim();
  }
  if (typeof parsed.role === "string" && parsed.role.trim()) {
    payload.role = parsed.role.trim();
  }
  if (typeof parsed.exp === "number" && Number.isFinite(parsed.exp)) {
    payload.exp = parsed.exp;
  }
  return payload;
}

export function parseJwtRole(token: string): Role | null {
  const payload = decodeJwtPayload(token);
  if (payload?.role === "admin" || payload?.role === "parent") {
    return payload.role;
  }
  return null;
}

export function isTokenExpired(
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }
  return payload.exp <= nowSeconds;
}

export function inspectSessionToken(
  token: string | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionInspection {
  if (!token) {
    return { valid: false, expired: false, role: null, email: null };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { valid: false, expired: false, role: null, email: null };
  }

  if (typeof payload.exp !== "number" || payload.exp <= nowSeconds) {
    return { valid: false, expired: true, role: null, email: null };
  }

  const role =
    payload.role === "admin" || payload.role === "parent" ? payload.role : null;
  if (!role) {
    return { valid: false, expired: false, role: null, email: null };
  }

  return {
    valid: true,
    expired: false,
    role,
    email: payload.sub ?? null,
  };
}
