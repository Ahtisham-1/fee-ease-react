import assert from "node:assert/strict";
import test from "node:test";

import {
  ApiError,
  createApiClient,
  extractErrorMessage,
  resolveApiBase,
  type TokenStorageLike,
} from "../src/services/apiClient.ts";

function createStubStorage(initialToken: string | null = null) {
  let token = initialToken;
  let clearCount = 0;

  const storage: TokenStorageLike = {
    async getToken() {
      return token;
    },
    async setAuthToken(nextToken: string) {
      token = nextToken;
    },
    async clearAuthToken() {
      clearCount += 1;
      token = null;
    },
  };

  return {
    storage,
    getCurrentToken: () => token,
    getClearCount: () => clearCount,
  };
}

test("resolveApiBase allows HTTPS URLs and strips trailing slashes", () => {
  assert.equal(
    resolveApiBase("https://api.feeease.example.com///"),
    "https://api.feeease.example.com",
  );
});

test("resolveApiBase allows local development HTTP hosts only", () => {
  assert.equal(resolveApiBase("http://localhost:8000/"), "http://localhost:8000");
  assert.equal(resolveApiBase("http://127.0.0.1:8000"), "http://127.0.0.1:8000");
  assert.equal(resolveApiBase("http://10.0.2.2:8000"), "http://10.0.2.2:8000");
  assert.equal(resolveApiBase("http://192.168.1.42:8000"), "http://192.168.1.42:8000");
  assert.equal(resolveApiBase("http://172.16.0.5:8000"), "http://172.16.0.5:8000");
});

test("resolveApiBase rejects public cleartext HTTP URLs and invalid protocols", () => {
  assert.throws(
    () => resolveApiBase("http://api.feeease.com"),
    /HTTPS is required/i,
  );
  assert.throws(
    () => resolveApiBase("http://172.32.0.1:8000"),
    /HTTPS is required/i,
  );
  assert.throws(
    () => resolveApiBase("ftp://api.feeease.com"),
    /Unsupported API protocol/i,
  );
});

test("extractErrorMessage handles FastAPI string detail and validation lists", () => {
  assert.equal(
    extractErrorMessage({ detail: "Invalid credentials" }, "Fallback"),
    "Invalid credentials",
  );
  assert.equal(
    extractErrorMessage(
      { detail: [{ msg: "Field required" }, { msg: "Invalid phone" }] },
      "Fallback",
    ),
    "Field required; Invalid phone",
  );
  assert.equal(extractErrorMessage({ message: "Something failed" }, "Fallback"), "Something failed");
  assert.equal(extractErrorMessage(null, "Fallback"), "Fallback");
});

test("requestJson blocks protocol-relative or external URLs before calling fetch", async () => {
  let fetchCalled = false;
  const { storage } = createStubStorage("secret.jwt");
  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: (async () => {
      fetchCalled = true;
      return new Response("{}");
    }) as typeof fetch,
  });

  await assert.rejects(
    () => client.requestJson("//evil.example.com/steal"),
    /Invalid API path/i,
  );
  await assert.rejects(
    () => client.requestJson("https://evil.example.com/steal"),
    /Invalid API path/i,
  );
  await assert.rejects(
    () => client.requestJson("api/auth/me"),
    /Invalid API path/i,
  );
  assert.equal(fetchCalled, false);
});

test("requestJson attaches Bearer token unless skipAuth is true", async () => {
  const seenAuthHeaders: Array<string | null> = [];
  const { storage } = createStubStorage("parent.jwt.token");

  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: (async (_input, init) => {
      const headers = new Headers(init?.headers);
      seenAuthHeaders.push(headers.get("Authorization"));
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch,
  });

  const authed = await client.requestJson<{ ok: boolean }>("/api/parent/me");
  assert.deepEqual(authed, { ok: true });

  await client.requestJson<{ ok: boolean }>("/api/auth/login", {
    method: "POST",
    skipAuth: true,
    body: { username: "parent@example.com" },
  });

  assert.deepEqual(seenAuthHeaders, ["Bearer parent.jwt.token", null]);
});

test("requestJson clears token and invokes unauthorized handler on 401 when token was sent", async () => {
  const { storage, getCurrentToken, getClearCount } = createStubStorage("expired.jwt");
  let unauthorizedCalls = 0;

  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: (async () =>
      new Response(JSON.stringify({ detail: "Token expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch,
  });

  const unsubscribe = client.registerUnauthorizedHandler(() => {
    unauthorizedCalls += 1;
  });

  await assert.rejects(
    () => client.requestJson("/api/parent/dashboard"),
    (err: unknown) => err instanceof ApiError && err.status === 401 && err.message === "Token expired",
  );

  assert.equal(getCurrentToken(), null);
  assert.equal(getClearCount(), 1);
  assert.equal(unauthorizedCalls, 1);
  unsubscribe();
});

test("requestJson does NOT trigger unauthorized handler on 401 when skipAuth is true", async () => {
  const { storage, getCurrentToken, getClearCount } = createStubStorage("existing.jwt");
  let unauthorizedCalls = 0;

  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: (async () =>
      new Response(JSON.stringify({ detail: "Incorrect username or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch,
  });

  client.registerUnauthorizedHandler(() => {
    unauthorizedCalls += 1;
  });

  await assert.rejects(
    () => client.requestJson("/api/auth/login", { method: "POST", skipAuth: true }),
    (err: unknown) =>
      err instanceof ApiError &&
      err.status === 401 &&
      err.message === "Incorrect username or password",
  );

  assert.equal(getCurrentToken(), "existing.jwt");
  assert.equal(getClearCount(), 0);
  assert.equal(unauthorizedCalls, 0);
});

test("requestJson handles non-JSON responses and request timeouts as ApiError", async () => {
  const { storage } = createStubStorage(null);

  const htmlClient = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: (async () =>
      new Response("<html>Bad Gateway</html>", { status: 502 })) as typeof fetch,
  });

  await assert.rejects(
    () => htmlClient.requestJson("/api/parent/me"),
    (err: unknown) => err instanceof ApiError && err.status === 502,
  );

  const slowClient = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: ((_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const abortErr = new Error("Aborted");
          abortErr.name = "AbortError";
          reject(abortErr);
        });
      })) as typeof fetch,
  });

  await assert.rejects(
    () => slowClient.requestJson("/api/parent/me", { timeoutMs: 20 }),
    (err: unknown) => err instanceof ApiError && err.status === 0 && /timed out/i.test(err.message),
  );
});

test("expectArray returns arrays and throws on malformed non-array payloads", () => {
  const { storage } = createStubStorage(null);
  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
  });

  assert.deepEqual(client.expectArray([1, 2], "payments"), [1, 2]);
  assert.throws(
    () => client.expectArray({ items: [] }, "payments"),
    /Invalid payments response/i,
  );
});
