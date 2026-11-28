export const TOKEN_KEY = "fee_ease_auth_token";

export type SecureStoreOptionsLike = {
  keychainAccessible?: number;
};

export interface SecureStoreLike {
  getItemAsync(
    key: string,
    options?: SecureStoreOptionsLike,
  ): Promise<string | null>;
  setItemAsync(
    key: string,
    value: string,
    options?: SecureStoreOptionsLike,
  ): Promise<void>;
  deleteItemAsync(key: string, options?: SecureStoreOptionsLike): Promise<void>;
}

export interface TokenStorage {
  getToken(): Promise<string | null>;
  setAuthToken(token: string): Promise<void>;
  clearAuthToken(): Promise<void>;
}

function sanitizeToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Cannot store an empty authentication token.");
  }
  // Reject whitespace/CRLF inside tokens to prevent HTTP header injection.
  if (/\s/.test(trimmed)) {
    throw new Error("Cannot store a malformed authentication token.");
  }
  return trimmed;
}

export function createTokenStorage(
  store: SecureStoreLike,
  keychainAccessible?: number,
): TokenStorage {
  const accessOptions: SecureStoreOptionsLike | undefined =
    keychainAccessible === undefined ? undefined : { keychainAccessible };

  return {
    async getToken(): Promise<string | null> {
      try {
        const stored = await store.getItemAsync(TOKEN_KEY, accessOptions);
        if (typeof stored !== "string") {
          return null;
        }
        const trimmed = stored.trim();
        return trimmed.length > 0 ? trimmed : null;
      } catch {
        // Never fall back to unencrypted storage or crash auth checks on keychain read errors.
        return null;
      }
    },

    async setAuthToken(token: string): Promise<void> {
      if (typeof token !== "string") {
        throw new Error("Cannot store an empty authentication token.");
      }
      const normalized = sanitizeToken(token);
      await store.setItemAsync(TOKEN_KEY, normalized, accessOptions);
    },

    async clearAuthToken(): Promise<void> {
      await store.deleteItemAsync(TOKEN_KEY, accessOptions);
    },
  };
}

let defaultStoragePromise: Promise<TokenStorage> | null = null;

async function getDefaultStorage(): Promise<TokenStorage> {
  if (!defaultStoragePromise) {
    // Lazy import keeps Node unit tests decoupled from Expo's native bridge while Metro bundles it normally.
    defaultStoragePromise = import("expo-secure-store").then((SecureStore) =>
      createTokenStorage(
        SecureStore,
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      ),
    );
  }
  return defaultStoragePromise;
}

export async function getToken(): Promise<string | null> {
  const storage = await getDefaultStorage();
  return storage.getToken();
}

export async function setAuthToken(token: string): Promise<void> {
  const storage = await getDefaultStorage();
  return storage.setAuthToken(token);
}

export async function clearAuthToken(): Promise<void> {
  const storage = await getDefaultStorage();
  return storage.clearAuthToken();
}
