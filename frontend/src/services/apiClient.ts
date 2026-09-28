// ==========================================================================
// Shared HTTP client for all backend services.
// Single source of truth for the API base URL, JSON parsing, timeouts and
// error extraction (FastAPI returns { detail: "..." } on failures).
// ==========================================================================

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(
      "Server returned an invalid response. Is the backend running?",
      response.status,
    );
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body &&
    typeof (body as { detail: unknown }).detail === "string"
  ) {
    return (body as { detail: string }).detail;
  }
  return fallback;
}

/**
 * Request init where `body` is an arbitrary JSON-serializable value instead
 * of the DOM BodyInit union.
 */
export type JsonRequestInit = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Performs a JSON request against the backend and returns the parsed body.
 * Throws ApiError with the server's own message whenever the response is not ok.
 */
export async function requestJson<T>(
  path: string,
  init: JsonRequestInit = {},
): Promise<T> {
  const { body, headers, ...rest } = init;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Check your connection.", 0);
    }
    throw new ApiError(
      "Cannot reach the server. Check that the backend is running.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  const parsed = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(parsed, `Request failed (${response.status})`),
      response.status,
    );
  }

  return parsed as T;
}

/** Guards list endpoints against a non-array payload. */
export function expectArray<T>(value: unknown, what: string): T[] {
  if (!Array.isArray(value)) {
    throw new ApiError(`Unexpected response while loading ${what}.`, 0);
  }
  return value as T[];
}
