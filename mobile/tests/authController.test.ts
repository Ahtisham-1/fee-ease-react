import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthController,
  SESSION_EXPIRED_NOTICE,
  type AuthState,
} from "../src/context/authController";

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${toBase64Url(JSON.stringify(payload))}.c2lnX3BsYWNlaG9sZGVy`;
}

const NOW = 1_800_000_000;
const PARENT_JWT = makeJwt({ sub: "parent@example.com", role: "parent", exp: NOW + 3600 });
const SECOND_PARENT_JWT = makeJwt({ sub: "parent2@example.com", role: "parent", exp: NOW + 3600 });
const ADMIN_JWT = makeJwt({ sub: "admin@school.com", role: "admin", exp: NOW + 3600 });
const EXPIRED_JWT = makeJwt({ sub: "parent@example.com", role: "parent", exp: NOW - 10 });

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test("authController hydrates valid parent token and rejects/clears expired tokens on cold start", async () => {
  let storedToken: string | null = PARENT_JWT;
  const states: AuthState[] = [];

  const controller = createAuthController({
    getToken: async () => storedToken,
    setAuthToken: async (t) => {
      storedToken = t;
    },
    clearAuthToken: async () => {
      storedToken = null;
    },
    loginApi: async () => ({ access_token: PARENT_JWT, token_type: "bearer" }),
    registerUnauthorizedHandler: () => () => {},
    onStateChange: (s) => states.push(s),
    nowSeconds: () => NOW,
  });

  const stop = controller.start();
  await flushMicrotasks();

  assert.deepEqual(controller.getState(), {
    isHydrating: false,
    isLoggedIn: true,
    userRole: "parent",
    userEmail: "parent@example.com",
    sessionNotice: null,
  });
  stop();

  // Expired token clears storage and sets sessionNotice.
  storedToken = EXPIRED_JWT;
  const expiredController = createAuthController({
    getToken: async () => storedToken,
    setAuthToken: async (t) => {
      storedToken = t;
    },
    clearAuthToken: async () => {
      storedToken = null;
    },
    loginApi: async () => ({ access_token: PARENT_JWT, token_type: "bearer" }),
    registerUnauthorizedHandler: () => () => {},
    onStateChange: () => {},
    nowSeconds: () => NOW,
  });

  const stopExpired = expiredController.start();
  await flushMicrotasks();
  assert.equal(storedToken, null);
  assert.equal(expiredController.getState().isHydrating, false);
  assert.equal(expiredController.getState().isLoggedIn, false);
  assert.equal(expiredController.getState().sessionNotice, SESSION_EXPIRED_NOTICE);
  stopExpired();
});

test("authController never persists admin tokens and clears any pre-existing token on admin login", async () => {
  let storedToken: string | null = ADMIN_JWT;
  let setCalls = 0;

  // Admin token left on disk must never re-hydrate.
  const controller = createAuthController({
    getToken: async () => storedToken,
    setAuthToken: async (t) => {
      setCalls += 1;
      storedToken = t;
    },
    clearAuthToken: async () => {
      storedToken = null;
    },
    loginApi: async () => ({ access_token: ADMIN_JWT, token_type: "bearer" }),
    registerUnauthorizedHandler: () => () => {},
    onStateChange: () => {},
    nowSeconds: () => NOW,
  });

  const stop = controller.start();
  await flushMicrotasks();
  assert.equal(storedToken, null);
  assert.equal(controller.getState().isLoggedIn, false);
  assert.equal(controller.getState().userRole, null);

  // Admin login sets in-memory role="admin" for desktop notice screen WITHOUT writing to SecureStore.
  storedToken = PARENT_JWT;
  const role = await controller.login("admin@school.com", "secret");
  assert.equal(role, "admin");
  assert.equal(setCalls, 0);
  assert.equal(storedToken, null);
  assert.equal(controller.getState().isLoggedIn, true);
  assert.equal(controller.getState().userRole, "admin");
  stop();

  // Admin Sign Out succeeds gracefully even if clearAuthToken throws (e.g. Web without SecureStore).
  const webAdminController = createAuthController({
    getToken: async () => null,
    setAuthToken: async () => {},
    clearAuthToken: async () => {
      throw new Error("SecureStore unavailable on web");
    },
    loginApi: async () => ({ access_token: ADMIN_JWT, token_type: "bearer" }),
    registerUnauthorizedHandler: () => () => {},
    onStateChange: () => {},
    nowSeconds: () => NOW,
  });
  const stopWebAdmin = webAdminController.start();
  await flushMicrotasks();
  assert.equal(await webAdminController.login("admin@school.com", "secret"), "admin");
  await webAdminController.logout();
  assert.equal(webAdminController.getState().isLoggedIn, false);
  assert.equal(webAdminController.getState().userRole, null);
  stopWebAdmin();
});

test("authController exits isHydrating cleanly even when getToken throws", async () => {
  const controller = createAuthController({
    getToken: async () => {
      throw new Error("SecureStore unavailable on web");
    },
    setAuthToken: async () => {},
    clearAuthToken: async () => {},
    loginApi: async () => ({ access_token: PARENT_JWT, token_type: "bearer" }),
    registerUnauthorizedHandler: () => () => {},
    onStateChange: () => {},
    nowSeconds: () => NOW,
  });

  const stop = controller.start();
  await flushMicrotasks();

  assert.equal(controller.getState().isHydrating, false);
  assert.equal(controller.getState().isLoggedIn, false);
  assert.equal(controller.getState().userRole, null);
  stop();
});

test("authController prevents overlapping login and hydration/logout/401 race corruption", async () => {
  let storedToken: string | null = EXPIRED_JWT;
  let releaseHydration!: (val: string | null) => void;
  let releaseFirstLogin!: (res: { access_token: string; token_type: string }) => void;
  let unauthorizedCallback: () => void | Promise<void> = () => {};
  let loginCallCount = 0;

  const controller = createAuthController({
    getToken: () => {
      // First call (hydration initial check) stalls until released manually.
      if (storedToken === EXPIRED_JWT) {
        return new Promise((resolve) => {
          releaseHydration = resolve;
        });
      }
      return Promise.resolve(storedToken);
    },
    setAuthToken: async (t) => {
      storedToken = t;
    },
    clearAuthToken: async () => {
      storedToken = null;
    },
    loginApi: (email) => {
      loginCallCount += 1;
      if (loginCallCount === 1) {
        return new Promise((resolve) => {
          releaseFirstLogin = resolve;
        });
      }
      return Promise.resolve({
        access_token: email.includes("2") ? SECOND_PARENT_JWT : PARENT_JWT,
        token_type: "bearer",
      });
    },
    registerUnauthorizedHandler: (cb) => {
      unauthorizedCallback = cb;
      return () => {
        unauthorizedCallback = () => {};
      };
    },
    onStateChange: () => {},
    nowSeconds: () => NOW,
  });

  const stop = controller.start();

  // 1) Start login1, let it enter loginApi, then tap login2 before login1 resolves.
  const firstLoginPromise = controller.login("parent1@example.com", "pass");
  await flushMicrotasks();
  const secondLoginPromise = controller.login("parent2@example.com", "pass");

  releaseFirstLogin({ access_token: PARENT_JWT, token_type: "bearer" });
  await assert.rejects(firstLoginPromise, /superseded/i);
  const role2 = await secondLoginPromise;
  assert.equal(role2, "parent");
  assert.equal(storedToken, SECOND_PARENT_JWT);

  // 2) Double-tap before microtask queue drains skips redundant API call for superseded tap.
  const callsBeforeDoubleTap = loginCallCount;
  const doubleTapA = controller.login("parent1@example.com", "pass");
  const doubleTapB = controller.login("parent2@example.com", "pass");
  await assert.rejects(doubleTapA, /superseded/i);
  assert.equal(await doubleTapB, "parent");
  assert.equal(loginCallCount, callsBeforeDoubleTap + 1);

  // Delayed hydration finally wakes up with old EXPIRED_JWT: MUST NOT delete SECOND_PARENT_JWT!
  releaseHydration(EXPIRED_JWT);
  await flushMicrotasks();
  assert.equal(storedToken, SECOND_PARENT_JWT);
  assert.equal(controller.getState().userEmail, "parent2@example.com");

  // Trigger 401 unauthorized callback -> signs out with notice.
  await unauthorizedCallback();
  assert.equal(controller.getState().isLoggedIn, false);
  assert.equal(controller.getState().sessionNotice, SESSION_EXPIRED_NOTICE);

  // Explicit logout clears notice and does not leave isHydrating stuck.
  await controller.logout();
  assert.equal(controller.getState().isHydrating, false);
  assert.equal(controller.getState().isLoggedIn, false);
  assert.equal(controller.getState().sessionNotice, null);
  stop();
});
