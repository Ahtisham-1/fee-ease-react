import assert from "node:assert/strict";
import test from "node:test";

import {
  TOKEN_KEY,
  createTokenStorage,
  type SecureStoreLike,
} from "../src/services/tokenStorage.ts";

function createMemoryStore(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  const calls: Array<{ op: string; key: string; options?: unknown }> = [];

  const store: SecureStoreLike = {
    async getItemAsync(key, options) {
      calls.push({ op: "get", key, options });
      return data.get(key) ?? null;
    },
    async setItemAsync(key, value, options) {
      calls.push({ op: "set", key, options });
      data.set(key, value);
    },
    async deleteItemAsync(key, options) {
      calls.push({ op: "delete", key, options });
      data.delete(key);
    },
  };

  return { store, data, calls };
}

test("TOKEN_KEY matches shared FeeEase auth token key", () => {
  assert.equal(TOKEN_KEY, "fee_ease_auth_token");
});

test("setAuthToken trims token and writes with WHEN_UNLOCKED_THIS_DEVICE_ONLY", async () => {
  const { store, data, calls } = createMemoryStore();
  const storage = createTokenStorage(store, 6);

  await storage.setAuthToken("  jwt.header.payload  ");

  assert.equal(data.get(TOKEN_KEY), "jwt.header.payload");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    op: "set",
    key: TOKEN_KEY,
    options: { keychainAccessible: 6 },
  });
});

test("setAuthToken rejects empty or whitespace-only tokens", async () => {
  const { store, data, calls } = createMemoryStore();
  const storage = createTokenStorage(store, 6);

  await assert.rejects(
    () => storage.setAuthToken(""),
    /empty authentication token/i,
  );
  await assert.rejects(
    () => storage.setAuthToken("   \n\t "),
    /empty authentication token/i,
  );
  assert.equal(data.size, 0);
  assert.equal(calls.length, 0);
});

test("getToken returns trimmed token or null when empty", async () => {
  const { store } = createMemoryStore({ [TOKEN_KEY]: "  abc.def.ghi  " });
  const storage = createTokenStorage(store, 6);

  assert.equal(await storage.getToken(), "abc.def.ghi");

  const emptyStore = createMemoryStore({ [TOKEN_KEY]: "   " });
  const emptyStorage = createTokenStorage(emptyStore.store, 6);
  assert.equal(await emptyStorage.getToken(), null);
});

test("clearAuthToken deletes token from secure storage", async () => {
  const { store, data } = createMemoryStore({ [TOKEN_KEY]: "secret.jwt" });
  const storage = createTokenStorage(store, 6);

  await storage.clearAuthToken();
  assert.equal(data.has(TOKEN_KEY), false);
  assert.equal(await storage.getToken(), null);
});

test("getToken returns null safely if secure store read throws", async () => {
  const failingStore: SecureStoreLike = {
    async getItemAsync() {
      throw new Error("Keychain locked");
    },
    async setItemAsync() {},
    async deleteItemAsync() {},
  };
  const storage = createTokenStorage(failingStore, 6);

  assert.equal(await storage.getToken(), null);
});
