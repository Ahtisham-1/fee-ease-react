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

// Printable non-whitespace US-ASCII only: blocks CRLF, spaces, NUL/control bytes, and non-ASCII.
const VALID_TOKEN_PATTERN = /^[\x21-\x7e]+$/;

export function isValidAuthTokenFormat(token: string): boolean {
  return VALID_TOKEN_PATTERN.test(token);
}

function sanitizeToken(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new Error("Cannot store an empty authentication token.");
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Cannot store an empty authentication token.");
  }
  if (!isValidAuthTokenFormat(trimmed)) {
    throw new Error("Cannot store a malformed authentication token.");
  }
  return trimmed;
}

export function createTokenStorage(
  store: SecureStoreLike,
  keychainAccessible: number,
): TokenStorage {
  const accessOptions: SecureStoreOptionsLike = { keychainAccessible };

  return {
    async getToken(): Promise<string | null> {
      try {
        if (typeof store.getItemAsync !== "function") {
          return null;
        }
        const stored = await store.getItemAsync(TOKEN_KEY, accessOptions);
        if (typeof stored !== "string") {
          return null;
        }
        const trimmed = stored.trim();
        if (!trimmed || !isValidAuthTokenFormat(trimmed)) {
          return null;
        }
        return trimmed;
      } catch {
        // Never fall back to unencrypted storage or leak keychain internals.
        return null;
      }
    },

    async setAuthToken(token: string): Promise<void> {
      const normalized = sanitizeToken(token);
      if (typeof store.setItemAsync !== "function") {
        throw new Error(
          "Secure token storage is not available on this platform.",
        );
      }
      await store.setItemAsync(TOKEN_KEY, normalized, accessOptions);
    },

    async clearAuthToken(): Promise<void> {
      if (typeof store.deleteItemAsync !== "function") {
        throw new Error(
          "Secure token storage is not available on this platform.",
        );
      }
      await store.deleteItemAsync(TOKEN_KEY, accessOptions);
    },
  };
}

let defaultStoragePromise: Promise<TokenStorage> | null = null;

async function getDefaultStorage(): Promise<TokenStorage> {
  if (!defaultStoragePromise) {
    // Lazy import keeps Node unit tests decoupled from Expo's native bridge while Metro bundles it cleanly.
    defaultStoragePromise = import("expo-secure-store")
      .then((SecureStore) => {
        if (typeof SecureStore.setItemAsync !== "function") {
          throw new Error(
            "Secure token storage is not available on this platform.",
          );
        }
        return createTokenStorage(
          SecureStore,
          SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        );
      })
      .catch((error) => {
        defaultStoragePromise = null;
        throw error;
      });
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
