import assert from "node:assert/strict";
import test from "node:test";

import {
  ApiError,
  createApiClient,
  extractErrorMessage,
  resolveApiBase,
} from "../src/services/apiClient.ts";
import type { TokenStorage } from "../src/services/tokenStorage.ts";

function createStubStorage(initialToken: string | null = null) {
  let token = initialToken;
  let clearCount = 0;

  const storage: TokenStorage = {
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
    setTokenDirect: (next: string | null) => {
      token = next;
    },
    getCurrentToken: () => token,
    getClearCount: () => clearCount,
  };
}

test("resolveApiBase allows HTTPS URLs and strips trailing slashes", () => {
  assert.equal(
    resolveApiBase("https://api.feeease.example.com///", false),
    "https://api.feeease.example.com",
  );
});

test("resolveApiBase allows local dev HTTP when allowLocalHttp=true and blocks HTTP when false", () => {
  assert.equal(resolveApiBase("http://localhost:8000/", true), "http://localhost:8000");
  assert.equal(resolveApiBase("http://127.0.0.1:8000", true), "http://127.0.0.1:8000");
  assert.equal(resolveApiBase("http://10.0.2.2:8000", true), "http://10.0.2.2:8000");
  assert.equal(resolveApiBase("http://192.168.1.42:8000", true), "http://192.168.1.42:8000");
  assert.equal(resolveApiBase("http://172.16.0.5:8000", true), "http://172.16.0.5:8000");

  // Production / allowLocalHttp=false must reject even local HTTP and empty config.
  assert.throws(
    () => resolveApiBase("http://192.168.1.42:8000", false),
    /HTTPS is required/i,
  );
  assert.throws(
    () => resolveApiBase("http://10.0.2.2:8000", false),
    /HTTPS is required/i,
  );
  assert.throws(
    () => resolveApiBase("", false),
    /must be configured with HTTPS/i,
  );
});

test("resolveApiBase rejects public HTTP, non-canonical IPs, credentials, queries, and invalid schemes", () => {
  assert.throws(() => resolveApiBase("http://api.feeease.com", true), /HTTPS is required/i);
  assert.throws(() => resolveApiBase("http://172.32.0.1:8000", true), /HTTPS is required/i);
  assert.throws(() => resolveApiBase("http://0.0.0.0:8000", true), /HTTPS is required/i);
  assert.throws(() => resolveApiBase("http://169.254.169.254", true), /HTTPS is required/i);
  assert.throws(() => resolveApiBase("http://[::1]:8000", true), /HTTPS is required/i);
  assert.throws(() => resolveApiBase("https://user:pass@api.feeease.example.com"), /embedded credentials/i);
  assert.throws(() => resolveApiBase("https://api.feeease.example.com?x=1"), /query parameters/i);
  assert.throws(() => resolveApiBase("https://api.feeease.example.com#frag"), /query parameters/i);
  assert.throws(() => resolveApiBase("https://"), /Invalid API base URL/i);
  assert.throws(() => resolveApiBase("ftp://api.feeease.example.com"), /Unsupported API protocol/i);
});

test("extractErrorMessage handles FastAPI string, list, and plain string details", () => {
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
  assert.equal(extractErrorMessage({ detail: ["First error", "Second"] }, "Fallback"), "First error; Second");
  assert.equal(extractErrorMessage({ message: "Something failed" }, "Fallback"), "Something failed");
  assert.equal(extractErrorMessage("Plain failure", "Fallback"), "Plain failure");
  assert.equal(extractErrorMessage(null, "Fallback"), "Fallback");
});

test("requestJson blocks protocol-relative, external, traversal, control-char, and fragment paths", async () => {
  let fetchCalled = false;
  const { storage } = createStubStorage("secret.jwt");
  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com/v1",
    tokenStorage: storage,
    fetchFn: async () => {
      fetchCalled = true;
      return new Response("{}");
    },
  });

  for (const badPath of [
    "//evil.example.com/steal",
    "https://evil.example.com/steal",
    "api/auth/me",
    "/../admin",
    "/%2e%2e/admin",
    "/api/test\r\nX-Evil: 1",
    "/api/test\t",
    "/api/test\x00",
    "/api/test#frag",
    "/api\\evil",
  ]) {
    await assert.rejects(() => client.requestJson(badPath), /Invalid API path/i);
  }
  assert.equal(fetchCalled, false);
});

test("requestJson pins redirect=error, credentials=omit, strips spoofed Authorization, and serializes URLSearchParams", async () => {
  const recorded: Array<{
    url: string;
    auth: string | null;
    contentType: string | null;
    body: unknown;
    redirect: RequestRedirect | undefined;
    credentials: RequestCredentials | undefined;
  }> = [];
  const { storage } = createStubStorage("parent.jwt.token");

  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async (input, init) => {
      const headers = new Headers(init?.headers);
      recorded.push({
        url: String(input),
        auth: headers.get("Authorization"),
        contentType: headers.get("Content-Type"),
        body: init?.body,
        redirect: init?.redirect,
        credentials: init?.credentials,
      });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  await client.requestJson("/api/parent/me", {
    headers: { Authorization: "Bearer attacker-injected" },
  });

  const form = new URLSearchParams({ username: "parent@example.com", password: "secret" });
  await client.requestJson("/api/auth/login", {
    method: "POST",
    skipAuth: true,
    headers: { Authorization: "Bearer spoofed" },
    body: form,
  });

  assert.equal(recorded[0].auth, "Bearer parent.jwt.token");
  assert.equal(recorded[0].redirect, "error");
  assert.equal(recorded[0].credentials, "omit");

  assert.equal(recorded[1].auth, null);
  assert.equal(recorded[1].contentType, "application/x-www-form-urlencoded;charset=UTF-8");
  assert.equal(typeof recorded[1].body, "string");
  assert.equal(recorded[1].body, form.toString());
  assert.equal(recorded[1].redirect, "error");
  assert.equal(recorded[1].credentials, "omit");

  // Unauthenticated client with no stored token still strips spoofed Authorization headers.
  const empty = createStubStorage(null);
  let emptyAuthHeader: string | null = "not-checked";
  const unauthClient = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: empty.storage,
    fetchFn: async (_input, init) => {
      emptyAuthHeader = new Headers(init?.headers).get("Authorization");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });
  await unauthClient.requestJson("/api/public", {
    headers: { Authorization: "Bearer spoofed" },
  });
  assert.equal(emptyAuthHeader, null);
});

test("requestJson deduplicates concurrent 401 cleanups, isolates handler failures, and supports unsubscribe", async () => {
  const { storage, getCurrentToken, getClearCount } = createStubStorage("expired.jwt");
  let workingHandlerCalls = 0;

  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async () =>
      new Response(JSON.stringify({ detail: "Token expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
  });

  client.registerUnauthorizedHandler(() => {
    throw new Error("Handler 1 crashed");
  });
  const unsubscribe = client.registerUnauthorizedHandler(() => {
    workingHandlerCalls += 1;
  });

  const results = await Promise.allSettled([
    client.requestJson("/api/parent/me"),
    client.requestJson("/api/parent/dashboard"),
  ]);

  assert.equal(results[0].status, "rejected");
  assert.equal(results[1].status, "rejected");
  assert.ok(
    results[0].status === "rejected" &&
      results[0].reason instanceof ApiError &&
      results[0].reason.status === 401,
  );
  assert.equal(getCurrentToken(), null);
  assert.equal(getClearCount(), 1);
  assert.equal(workingHandlerCalls, 1);

  unsubscribe();
});

test("stale 401 response does not clear a newer token stored after re-login", async () => {
  const { storage, setTokenDirect, getCurrentToken, getClearCount } =
    createStubStorage("old.expired.jwt");
  let unauthorizedCalls = 0;

  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async () => {
      // Simulate user signing in with a fresh token while the stale request was in flight.
      setTokenDirect("fresh.valid.jwt");
      return new Response(JSON.stringify({ detail: "Token expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  client.registerUnauthorizedHandler(() => {
    unauthorizedCalls += 1;
  });

  await assert.rejects(
    () => client.requestJson("/api/parent/me"),
    (err: unknown) => err instanceof ApiError && err.status === 401,
  );

  assert.equal(getCurrentToken(), "fresh.valid.jwt");
  assert.equal(getClearCount(), 0);
  assert.equal(unauthorizedCalls, 0);
});

test("requestJson does NOT trigger unauthorized handler on 401 when skipAuth is true", async () => {
  const { storage, getCurrentToken, getClearCount } = createStubStorage("existing.jwt");
  let unauthorizedCalls = 0;

  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async () =>
      new Response(JSON.stringify({ detail: "Incorrect username or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
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

test("requestJson handles non-JSON errors, stalled body timeouts, pre-aborted signals, and generic network errors", async () => {
  const { storage } = createStubStorage(null);

  const htmlClient = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async () => new Response("<html>Bad Gateway</html>", { status: 502 }),
  });
  await assert.rejects(
    () => htmlClient.requestJson("/api/parent/me"),
    (err: unknown) => err instanceof ApiError && err.status === 502,
  );

  const badOkJsonClient = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async () => new Response("<html>Login</html>", { status: 200 }),
  });
  await assert.rejects(
    () => badOkJsonClient.requestJson("/api/parent/me"),
    (err: unknown) =>
      err instanceof ApiError && err.status === 200 && err.code === "invalid_response",
  );

  // Stalled response.text() must still respect timeoutMs!
  const stalledBodyClient = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async (_input, init) =>
      ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () =>
          new Promise<string>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              const err = new Error("Body aborted");
              err.name = "AbortError";
              reject(err);
            });
          }),
      }) as Response,
  });
  await assert.rejects(
    () => stalledBodyClient.requestJson("/api/parent/me", { timeoutMs: 20 }),
    (err: unknown) => err instanceof ApiError && err.status === 0 && err.code === "timeout",
  );

  // Pre-aborted external signal rejects without calling fetch.
  const preAborted = new AbortController();
  preAborted.abort();
  let calledOnPreAborted = false;
  const abortClient = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async () => {
      calledOnPreAborted = true;
      return new Response("{}");
    },
  });
  await assert.rejects(
    () => abortClient.requestJson("/api/parent/me", { signal: preAborted.signal }),
    (err: unknown) => err instanceof ApiError && err.code === "aborted",
  );
  assert.equal(calledOnPreAborted, false);

  // Raw internal host/TLS error text must not leak into ApiError.message.
  const leakingNetClient = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
    fetchFn: async () => {
      throw new Error("connect ECONNREFUSED 10.20.30.40:8443");
    },
  });
  await assert.rejects(
    () => leakingNetClient.requestJson("/api/parent/me"),
    (err: unknown) =>
      err instanceof ApiError &&
      err.code === "network" &&
      err.message === "Network request failed.",
  );
});

test("expectArray returns arrays and throws ApiError on malformed non-array payloads", () => {
  const { storage } = createStubStorage(null);
  const client = createApiClient({
    baseUrl: "https://api.feeease.example.com",
    tokenStorage: storage,
  });

  assert.deepEqual(client.expectArray([1, 2], "payments"), [1, 2]);
  assert.throws(
    () => client.expectArray({ items: [] }, "payments"),
    (err: unknown) => err instanceof ApiError && /Invalid payments response/i.test(err.message),
  );
});
