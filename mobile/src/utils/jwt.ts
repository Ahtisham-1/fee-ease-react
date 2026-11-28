import type { Role } from "../types/index";
import { hasSafeOwnKey, isRecord } from "./validation";

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
const ALLOWED_JWT_ALG = "HS256";
const BASE64URL_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;
const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64UrlBytes(segment: string): Uint8Array | null {
  if (
    !segment ||
    segment.length % 4 === 1 ||
    !BASE64URL_SEGMENT_PATTERN.test(segment)
  ) {
    return null;
  }

  const padded = segment
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(segment.length / 4) * 4, "=");

  const outputLength =
    (padded.length / 4) * 3 -
    (padded.endsWith("==") ? 2 : padded.endsWith("=") ? 1 : 0);
  const bytes = new Uint8Array(outputLength);
  let byteIndex = 0;

  for (let i = 0; i < padded.length; i += 4) {
    const c1 = BASE64_ALPHABET.indexOf(padded[i]);
    const c2 = BASE64_ALPHABET.indexOf(padded[i + 1]);
    const isPad3 = padded[i + 2] === "=";
    const isPad4 = padded[i + 3] === "=";
    const c3 = isPad3 ? 0 : BASE64_ALPHABET.indexOf(padded[i + 2]);
    const c4 = isPad4 ? 0 : BASE64_ALPHABET.indexOf(padded[i + 3]);

    if (c1 < 0 || c2 < 0 || c3 < 0 || c4 < 0) {
      return null;
    }

    // Reject non-canonical base64url encodings with non-zero trailing pad bits.
    if (isPad3 && (c2 & 0x0f) !== 0) {
      return null;
    }
    if (!isPad3 && isPad4 && (c3 & 0x03) !== 0) {
      return null;
    }

    const combined = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
    if (byteIndex < outputLength) bytes[byteIndex++] = (combined >> 16) & 0xff;
    if (byteIndex < outputLength) bytes[byteIndex++] = (combined >> 8) & 0xff;
    if (byteIndex < outputLength) bytes[byteIndex++] = combined & 0xff;
  }

  return bytes;
}

// Pure-JS strict UTF-8 decoder (Hermes does not provide global TextDecoder consistently).
export function decodeUtf8Bytes(bytes: Uint8Array): string | null {
  const codePoints: number[] = [];
  let i = 0;

  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 <= 0x7f) {
      codePoints.push(b1);
    } else if (b1 >= 0xc2 && b1 <= 0xdf) {
      if (i >= bytes.length) return null;
      const b2 = bytes[i++];
      if ((b2 & 0xc0) !== 0x80) return null;
      codePoints.push(((b1 & 0x1f) << 6) | (b2 & 0x3f));
    } else if (b1 >= 0xe0 && b1 <= 0xef) {
      if (i + 1 >= bytes.length) return null;
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      if ((b2 & 0xc0) !== 0x80 || (b3 & 0xc0) !== 0x80) return null;
      if (b1 === 0xe0 && b2 < 0xa0) return null;
      if (b1 === 0xed && b2 >= 0xa0) return null;
      codePoints.push(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
    } else if (b1 >= 0xf0 && b1 <= 0xf4) {
      if (i + 2 >= bytes.length) return null;
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      const b4 = bytes[i++];
      if (
        (b2 & 0xc0) !== 0x80 ||
        (b3 & 0xc0) !== 0x80 ||
        (b4 & 0xc0) !== 0x80
      ) {
        return null;
      }
      if (b1 === 0xf0 && b2 < 0x90) return null;
      if (b1 === 0xf4 && b2 > 0x8f) return null;
      codePoints.push(
        ((b1 & 0x07) << 18) |
          ((b2 & 0x3f) << 12) |
          ((b3 & 0x3f) << 6) |
          (b4 & 0x3f),
      );
    } else {
      return null;
    }
  }

  let result = "";
  for (let offset = 0; offset < codePoints.length; offset += 4096) {
    result += String.fromCodePoint(...codePoints.slice(offset, offset + 4096));
  }
  return result;
}

function decodeJsonSegment(segment: string): Record<string, unknown> | null {
  const bytes = decodeBase64UrlBytes(segment);
  if (!bytes) {
    return null;
  }
  const text = decodeUtf8Bytes(bytes);
  if (!text) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  for (const key of Object.keys(parsed)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return null;
    }
  }
  return parsed;
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

  if (
    parts[2].length % 4 === 1 ||
    !BASE64URL_SEGMENT_PATTERN.test(parts[2])
  ) {
    return null;
  }

  const header = decodeJsonSegment(parts[0]);
  if (
    !header ||
    !hasSafeOwnKey(header, "alg") ||
    typeof header.alg !== "string" ||
    header.alg !== ALLOWED_JWT_ALG
  ) {
    return null;
  }

  const parsed = decodeJsonSegment(parts[1]);
  if (!parsed) {
    return null;
  }

  const payload: JwtPayload = {};
  if (
    hasSafeOwnKey(parsed, "sub") &&
    typeof parsed.sub === "string" &&
    parsed.sub.trim()
  ) {
    payload.sub = parsed.sub.trim();
  }
  if (
    hasSafeOwnKey(parsed, "role") &&
    typeof parsed.role === "string" &&
    parsed.role.trim()
  ) {
    payload.role = parsed.role.trim();
  }
  if (
    hasSafeOwnKey(parsed, "exp") &&
    typeof parsed.exp === "number" &&
    Number.isFinite(parsed.exp)
  ) {
    payload.exp = parsed.exp;
  }
  return payload;
}

// Note: extracts valid role string only; callers making auth decisions must use inspectSessionToken().
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
  if (!Number.isFinite(nowSeconds)) {
    return true;
  }
  const payload = decodeJwtPayload(token);
  if (
    !payload ||
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp)
  ) {
    return true;
  }
  return !(payload.exp > nowSeconds);
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

  const role =
    payload.role === "admin" || payload.role === "parent" ? payload.role : null;
  if (!role || !payload.sub) {
    return { valid: false, expired: false, role: null, email: null };
  }

  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    return { valid: false, expired: false, role: null, email: null };
  }

  if (!Number.isFinite(nowSeconds) || !(payload.exp > nowSeconds)) {
    return { valid: false, expired: true, role: null, email: null };
  }

  return {
    valid: true,
    expired: false,
    role,
    email: payload.sub,
  };
}
