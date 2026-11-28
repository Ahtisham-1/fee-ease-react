import {
  clearAuthToken,
  getToken,
  isValidAuthTokenFormat,
  setAuthToken,
  type TokenStorage,
} from "./tokenStorage";

export const REQUEST_TIMEOUT_MS = 15_000;
const MAX_TIMEOUT_MS = 2_147_483_647;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const DEFAULT_DEV_API_URL = "http://10.0.2.2:8000";

export type ApiErrorCode =
  | "http"
  | "validation"
  | "timeout"
  | "aborted"
  | "network"
  | "invalid_response";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(message: string, status: number, code: ApiErrorCode = "http") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export type JsonRequestInit = Omit<
  RequestInit,
  "body" | "redirect" | "credentials"
> & {
  body?: unknown;
  skipAuth?: boolean;
  timeoutMs?: number;
};

type UnauthorizedHandler = () => void | Promise<void>;

export interface ApiClientDeps {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  tokenStorage?: TokenStorage;
  allowLocalHttp?: boolean;
}

export interface ApiClient {
  readonly API_BASE: string;
  requestJson<T>(path: string, options?: JsonRequestInit): Promise<T>;
  expectArray<T>(data: unknown, label: string): T[];
  registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void;
}

function isDevRuntime(): boolean {
  if (typeof __DEV__ !== "undefined") {
    return __DEV__;
  }
  return process.env.NODE_ENV !== "production";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "10.0.2.2"
  ) {
    return true;
  }

  // Reject non-canonical IPv4 formats (leading zeros, hex/octal/integer shorthands).
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(
    normalized,
  );
  if (!ipv4Match) {
    return false;
  }

  const rawOctets = ipv4Match.slice(1);
  if (rawOctets.some((part) => part.length > 1 && part.startsWith("0"))) {
    return false;
  }

  const octets = rawOctets.map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;
  if (first === 10) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  return false;
}

export function resolveApiBase(
  rawUrl?: string,
  allowLocalHttp = isDevRuntime(),
): string {
  let candidate: string | undefined;
  if (rawUrl !== undefined) {
    candidate = rawUrl.trim();
  } else {
    const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    candidate = envUrl
      ? envUrl
      : allowLocalHttp
        ? DEFAULT_DEV_API_URL
        : undefined;
  }

  if (!candidate) {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be configured with HTTPS in production.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Invalid API base URL configuration.");
  }

  // React Native's legacy Blob/URL polyfill does not always throw on bare schemes like "https://".
  if (!parsed.hostname || !parsed.origin || parsed.origin === "null") {
    throw new Error("Invalid API base URL configuration.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("API URL must not contain embedded credentials.");
  }

  if (parsed.search || parsed.hash) {
    throw new Error("API base URL must not contain query parameters or hash.");
  }

  if (parsed.protocol === "https:") {
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
  }

  if (parsed.protocol === "http:") {
    if (!allowLocalHttp || !isPrivateOrLoopbackHost(parsed.hostname)) {
      throw new Error(
        `HTTPS is required for non-local API URLs: ${parsed.origin}`,
      );
    }
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
  }

  throw new Error(`Unsupported API protocol: ${parsed.protocol}`);
}

function validateApiPath(path: string, apiBase: string): string {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("://") ||
    path.includes("\\") ||
    path.includes("#") ||
    /[\x00-\x1f\x7f]/.test(path) ||
    /(?:^|\/)(?:\.|%2e){1,2}(?:\/|$|\?)/i.test(path)
  ) {
    throw new Error("Invalid API path.");
  }

  const base = new URL(apiBase);
  const resolved = new URL(`${apiBase}${path}`);
  const basePrefix = base.pathname.endsWith("/")
    ? base.pathname
    : `${base.pathname}/`;

  if (
    resolved.origin !== base.origin ||
    (base.pathname !== "/" && !resolved.pathname.startsWith(basePrefix))
  ) {
    throw new Error("Invalid API path.");
  }

  return path;
}

export function extractErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }
  if (!isRecord(body)) {
    return fallback;
  }

  const { detail, message } = body;
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }
        if (isRecord(item) && typeof item.msg === "string") {
          return item.msg.trim();
        }
        return "";
      })
      .filter((msg) => msg.length > 0);
    if (messages.length > 0) {
      return messages.join("; ");
    }
  }
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return fallback;
}

function parseJsonSafely(
  text: string,
): { ok: true; value: unknown } | { ok: false } {
  if (!text.trim()) {
    return { ok: true, value: null };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

function isBinaryOrNativeBody(body: unknown): body is BodyInit {
  if (
    typeof body === "string" ||
    (typeof FormData !== "undefined" && body instanceof FormData) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return true;
  }
  // React Native asset upload object ({ uri: string }).
  return isRecord(body) && typeof body.uri === "string";
}

function serializeRequestBody(
  body: unknown,
  headers: Headers,
): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (
    typeof URLSearchParams !== "undefined" &&
    body instanceof URLSearchParams
  ) {
    if (!headers.has("Content-Type")) {
      headers.set(
        "Content-Type",
        "application/x-www-form-urlencoded;charset=UTF-8",
      );
    }
    // React Native convertRequestBody() drops URLSearchParams instances unless converted to string.
    return body.toString();
  }
  if (isBinaryOrNativeBody(body)) {
    return body;
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return JSON.stringify(body);
}

async function prepareRequestHeaders(
  customHeaders: HeadersInit | undefined,
  skipAuth: boolean,
  tokenStorage: TokenStorage,
): Promise<{ headers: Headers; sentToken: string | null }> {
  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  // Always strip caller-supplied Authorization before deciding whether to attach stored credentials.
  headers.delete("Authorization");

  if (skipAuth) {
    return { headers, sentToken: null };
  }

  const token = await tokenStorage.getToken();
  if (!token || !isValidAuthTokenFormat(token)) {
    return { headers, sentToken: null };
  }

  headers.set("Authorization", `Bearer ${token}`);
  return { headers, sentToken: token };
}

async function fetchTextWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  init: Omit<RequestInit, "redirect" | "credentials" | "signal">,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<{ status: number; ok: boolean; rawText: string }> {
  const controller = new AbortController();
  let timedOut = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const onExternalAbort = () => {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
    controller.abort();
  };

  if (externalSignal) {
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchFn(url, {
      ...init,
      signal: controller.signal,
      redirect: "error",
      credentials: "omit",
    });

    const contentLengthHeader = response.headers?.get?.("Content-Length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (
        Number.isFinite(contentLength) &&
        contentLength > MAX_RESPONSE_BYTES
      ) {
        throw new ApiError(
          "Server response exceeded maximum allowed size.",
          response.status,
          "invalid_response",
        );
      }
    }

    const rawText = await response.text();
    if (rawText.length > MAX_RESPONSE_BYTES) {
      throw new ApiError(
        "Server response exceeded maximum allowed size.",
        response.status,
        "invalid_response",
      );
    }

    return { status: response.status, ok: response.ok, rawText };
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (timedOut) {
      throw new ApiError("Request timed out. Please try again.", 0, "timeout");
    }
    if (
      controller.signal.aborted ||
      (err instanceof Error && err.name === "AbortError")
    ) {
      throw new ApiError("Request was cancelled.", 0, "aborted");
    }
    throw new ApiError("Network request failed.", 0, "network");
  } finally {
    clearTimeout(timeoutHandle);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

export function expectArray<T>(data: unknown, label: string): T[] {
  if (!Array.isArray(data)) {
    throw new ApiError(
      `Invalid ${label} response from server.`,
      0,
      "invalid_response",
    );
  }
  return data as T[];
}

const defaultTokenStorage: TokenStorage = {
  getToken,
  setAuthToken,
  clearAuthToken,
};

export function createApiClient(deps: ApiClientDeps = {}): ApiClient {
  const apiBase = resolveApiBase(deps.baseUrl, deps.allowLocalHttp);
  const fetchFn = deps.fetchFn ?? fetch;
  const tokenStorage = deps.tokenStorage ?? defaultTokenStorage;
  const unauthorizedHandlers = new Set<UnauthorizedHandler>();
  const unauthorizedInFlight = new Map<string, Promise<void>>();

  function registerUnauthorizedHandler(
    handler: UnauthorizedHandler,
  ): () => void {
    unauthorizedHandlers.add(handler);
    return () => {
      unauthorizedHandlers.delete(handler);
    };
  }

  async function handleUnauthorized(sentToken: string): Promise<void> {
    const existing = unauthorizedInFlight.get(sentToken);
    if (existing) {
      await existing;
      return;
    }

    const cleanupPromise = (async () => {
      // Skip clearing if user re-authenticated with a newer token while this request was in flight.
      const currentToken = await tokenStorage.getToken();
      if (currentToken !== sentToken) {
        return;
      }

      try {
        await tokenStorage.clearAuthToken();
      } catch {
        // Best-effort clear; still notify auth state listeners below.
      }

      for (const handler of [...unauthorizedHandlers]) {
        try {
          await handler();
        } catch {
          // Isolate handler failures so remaining listeners execute and ApiError(401) is thrown.
        }
      }
    })().finally(() => {
      unauthorizedInFlight.delete(sentToken);
    });

    unauthorizedInFlight.set(sentToken, cleanupPromise);
    await cleanupPromise;
  }

  async function requestJson<T>(
    path: string,
    options: JsonRequestInit = {},
  ): Promise<T> {
    const safePath = validateApiPath(path, apiBase);
    const {
      body,
      headers: customHeaders,
      skipAuth = false,
      timeoutMs = REQUEST_TIMEOUT_MS,
      signal: externalSignal,
      ...rest
    } = options;

    if (
      !Number.isFinite(timeoutMs) ||
      timeoutMs <= 0 ||
      timeoutMs > MAX_TIMEOUT_MS
    ) {
      throw new Error("Invalid request timeout.");
    }

    if (externalSignal?.aborted) {
      throw new ApiError("Request was cancelled.", 0, "aborted");
    }

    const { headers, sentToken } = await prepareRequestHeaders(
      customHeaders,
      skipAuth,
      tokenStorage,
    );
    const requestBody = serializeRequestBody(body, headers);

    const { status, ok, rawText } = await fetchTextWithTimeout(
      fetchFn,
      `${apiBase}${safePath}`,
      { ...rest, headers, body: requestBody },
      timeoutMs,
      externalSignal ?? undefined,
    );

    const parsed = parseJsonSafely(rawText);

    if (!ok) {
      const fallback = `Request failed (${status}).`;
      const errorMessage = parsed.ok
        ? extractErrorMessage(parsed.value, fallback)
        : fallback;

      if (status === 401 && sentToken !== null) {
        await handleUnauthorized(sentToken);
      }

      throw new ApiError(errorMessage, status, "http");
    }

    if (!parsed.ok) {
      throw new ApiError(
        "Unexpected response from server.",
        status,
        "invalid_response",
      );
    }

    return parsed.value as T;
  }

  return {
    API_BASE: apiBase,
    requestJson,
    expectArray,
    registerUnauthorizedHandler,
  };
}

let defaultClient: ApiClient | null = null;

function getDefaultClient(): ApiClient {
  if (!defaultClient) {
    defaultClient = createApiClient();
  }
  return defaultClient;
}

export function getApiBase(): string {
  return getDefaultClient().API_BASE;
}

export async function requestJson<T>(
  path: string,
  options?: JsonRequestInit,
): Promise<T> {
  return getDefaultClient().requestJson<T>(path, options);
}

export function registerUnauthorizedHandler(
  handler: UnauthorizedHandler,
): () => void {
  return getDefaultClient().registerUnauthorizedHandler(handler);
}
