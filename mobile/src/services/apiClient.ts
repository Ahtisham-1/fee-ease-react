import {
  clearAuthToken,
  getToken,
  setAuthToken,
  type TokenStorage,
} from "./tokenStorage.ts";

export const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_DEV_API_URL = "http://10.0.2.2:8000";

export type TokenStorageLike = TokenStorage;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
  timeoutMs?: number;
};

type UnauthorizedHandler = () => void | Promise<void>;

export interface ApiClientDeps {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  tokenStorage?: TokenStorageLike;
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

  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(
    normalized,
  );
  if (!ipv4Match) {
    return false;
  }

  const octets = ipv4Match.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;
  if (first === 10) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  return false;
}

export function resolveApiBase(rawUrl?: string): string {
  const candidate = (
    rawUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    DEFAULT_DEV_API_URL
  ).trim();

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`Invalid API URL configured: ${candidate}`);
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
    if (!isPrivateOrLoopbackHost(parsed.hostname)) {
      throw new Error(
        `HTTPS is required for non-local API URLs: ${parsed.origin}`,
      );
    }
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
  }

  throw new Error(`Unsupported API protocol: ${parsed.protocol}`);
}

function validateApiPath(path: string): string {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("://") ||
    path.includes("\\") ||
    /[\r\n]/.test(path)
  ) {
    throw new Error(`Invalid API path: ${String(path)}`);
  }
  return path;
}

export function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    if ("detail" in body) {
      const detail = (body as { detail?: unknown }).detail;
      if (typeof detail === "string" && detail.trim()) {
        return detail.trim();
      }
      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => {
            if (
              item &&
              typeof item === "object" &&
              "msg" in item &&
              typeof (item as { msg?: unknown }).msg === "string"
            ) {
              return (item as { msg: string }).msg.trim();
            }
            return "";
          })
          .filter((msg) => msg.length > 0);
        if (messages.length > 0) {
          return messages.join("; ");
        }
      }
    }

    if ("message" in body) {
      const msg = (body as { message?: unknown }).message;
      if (typeof msg === "string" && msg.trim()) {
        return msg.trim();
      }
    }
  }

  return fallback;
}

function parseJsonSafely(text: string): { ok: true; value: unknown } | { ok: false } {
  if (!text.trim()) {
    return { ok: true, value: null };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

function serializeRequestBody(
  body: unknown,
  headers: Headers,
): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (
    typeof body === "string" ||
    body instanceof URLSearchParams ||
    body instanceof FormData
  ) {
    return body;
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return JSON.stringify(body);
}

const defaultTokenStorage: TokenStorageLike = {
  getToken,
  setAuthToken,
  clearAuthToken,
};

export function createApiClient(deps: ApiClientDeps = {}) {
  const apiBase = resolveApiBase(deps.baseUrl);
  const fetchFn = deps.fetchFn ?? fetch;
  const tokenStorage = deps.tokenStorage ?? defaultTokenStorage;
  const unauthorizedHandlers = new Set<UnauthorizedHandler>();

  function registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
    unauthorizedHandlers.add(handler);
    return () => {
      unauthorizedHandlers.delete(handler);
    };
  }

  async function requestJson<T>(
    path: string,
    options: JsonRequestInit = {},
  ): Promise<T> {
    const safePath = validateApiPath(path);
    const {
      body,
      headers: customHeaders,
      skipAuth = false,
      timeoutMs = REQUEST_TIMEOUT_MS,
      signal: externalSignal,
      ...rest
    } = options;

    const headers = new Headers(customHeaders);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    let tokenAttached = false;
    if (skipAuth) {
      headers.delete("Authorization");
    } else {
      const token = await tokenStorage.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        tokenAttached = true;
      }
    }

    const requestBody = serializeRequestBody(body, headers);

    const controller = new AbortController();
    let timedOut = false;
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener("abort", onExternalAbort, { once: true });
      }
    }

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    let response: Response;
    try {
      response = await fetchFn(`${apiBase}${safePath}`, {
        ...rest,
        headers,
        body: requestBody,
        signal: controller.signal,
      });
    } catch (err) {
      if (timedOut) {
        throw new ApiError("Request timed out. Please try again.", 0);
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new ApiError("Request was cancelled.", 0);
      }
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Network request failed.";
      throw new ApiError(message, 0);
    } finally {
      clearTimeout(timeoutHandle);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    }

    const rawText = await response.text();
    const parsed = parseJsonSafely(rawText);

    if (!response.ok) {
      const fallback = `Request failed (${response.status}).`;
      const errorMessage = parsed.ok
        ? extractErrorMessage(parsed.value, fallback)
        : fallback;

      if (response.status === 401 && tokenAttached) {
        await tokenStorage.clearAuthToken();
        for (const handler of [...unauthorizedHandlers]) {
          await handler();
        }
      }

      throw new ApiError(errorMessage, response.status);
    }

    if (!parsed.ok) {
      throw new ApiError("Unexpected response from server.", response.status);
    }

    return parsed.value as T;
  }

  function expectArray<T>(data: unknown, label: string): T[] {
    if (!Array.isArray(data)) {
      throw new Error(`Invalid ${label} response from server.`);
    }
    return data as T[];
  }

  return {
    API_BASE: apiBase,
    requestJson,
    expectArray,
    registerUnauthorizedHandler,
  };
}

const defaultClient = createApiClient();

export const API_BASE = defaultClient.API_BASE;
export const requestJson = defaultClient.requestJson;
export const expectArray = defaultClient.expectArray;
export const registerUnauthorizedHandler =
  defaultClient.registerUnauthorizedHandler;
