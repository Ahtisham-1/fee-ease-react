import { ApiError, registerUnauthorizedHandler } from "../services/apiClient";
import { loginApi, type LoginResponse } from "../services/authApi";
import {
  clearAuthToken,
  getToken,
  setAuthToken,
} from "../services/tokenStorage";
import type { Role } from "../types/index";
import { inspectSessionToken } from "../utils/jwt";

export const SESSION_EXPIRED_NOTICE =
  "Your session expired. Please log in again.";

export interface AuthState {
  isHydrating: boolean;
  isLoggedIn: boolean;
  userRole: Role | null;
  userEmail: string | null;
  sessionNotice: string | null;
}

export interface AuthControllerDeps {
  getToken?: () => Promise<string | null>;
  setAuthToken?: (token: string) => Promise<void>;
  clearAuthToken?: () => Promise<void>;
  loginApi?: (email: string, password: string) => Promise<LoginResponse>;
  registerUnauthorizedHandler?: (
    handler: () => void | Promise<void>,
  ) => () => void;
  onStateChange: (state: AuthState) => void;
  nowSeconds?: () => number;
}

export interface AuthController {
  start(): () => void;
  login(email: string, password: string): Promise<Role>;
  logout(): Promise<void>;
  clearSessionNotice(): void;
  getState(): AuthState;
}

export function createAuthController(
  deps: AuthControllerDeps,
): AuthController {
  const readToken = deps.getToken ?? getToken;
  const writeToken = deps.setAuthToken ?? setAuthToken;
  const deleteToken = deps.clearAuthToken ?? clearAuthToken;
  const performLogin = deps.loginApi ?? loginApi;
  const subscribeUnauthorized =
    deps.registerUnauthorizedHandler ?? registerUnauthorizedHandler;
  const nowSeconds = deps.nowSeconds ?? (() => Math.floor(Date.now() / 1000));

  let state: AuthState = {
    isHydrating: true,
    isLoggedIn: false,
    userRole: null,
    userEmail: null,
    sessionNotice: null,
  };

  let authEpoch = 0;
  let disposed = false;
  let explicitLogout = false;
  let opQueue: Promise<void> = Promise.resolve();

  function commitState(next: AuthState): void {
    state = next;
    if (!disposed) {
      deps.onStateChange(next);
    }
  }

  function enqueueAuthOp<T>(fn: () => Promise<T>): Promise<T> {
    const run = opQueue.then(fn, fn);
    opQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async function clearTokenIfStillMatches(expectedToken: string): Promise<void> {
    const latestToken = await readToken().catch(() => null);
    if (latestToken === expectedToken) {
      await deleteToken().catch(() => {});
    }
  }

  function start(): () => void {
    disposed = false;
    const hydrationEpoch = authEpoch;

    const unsubscribe = subscribeUnauthorized(() => {
      if (disposed || explicitLogout) {
        return;
      }
      authEpoch += 1;
      commitState({
        isHydrating: false,
        isLoggedIn: false,
        userRole: null,
        userEmail: null,
        sessionNotice: SESSION_EXPIRED_NOTICE,
      });
    });

    (async () => {
      try {
        const token = await readToken();
        if (disposed || authEpoch !== hydrationEpoch) {
          return;
        }

        const session = inspectSessionToken(token, nowSeconds());
        // Only parent sessions may persist across restarts; admin tokens stay memory-only.
        if (!session.valid || session.role !== "parent") {
          if (token && !disposed && authEpoch === hydrationEpoch) {
            await clearTokenIfStillMatches(token);
          }
          if (!disposed && authEpoch === hydrationEpoch) {
            commitState({
              isHydrating: false,
              isLoggedIn: false,
              userRole: null,
              userEmail: null,
              sessionNotice: session.expired ? SESSION_EXPIRED_NOTICE : null,
            });
          }
          return;
        }

        explicitLogout = false;
        commitState({
          isHydrating: false,
          isLoggedIn: true,
          userRole: "parent",
          userEmail: session.email,
          sessionNotice: null,
        });
      } catch {
        if (!disposed && authEpoch === hydrationEpoch) {
          commitState({
            isHydrating: false,
            isLoggedIn: false,
            userRole: null,
            userEmail: null,
            sessionNotice: null,
          });
        }
      }
    })();

    return () => {
      disposed = true;
      unsubscribe();
    };
  }

  function login(email: string, password: string): Promise<Role> {
    const loginEpoch = ++authEpoch;
    explicitLogout = false;

    return enqueueAuthOp(async () => {
      if (disposed || authEpoch !== loginEpoch) {
        throw new ApiError("Authentication was superseded.", 0, "aborted");
      }

      const response = await performLogin(email, password);
      const session = inspectSessionToken(response.access_token, nowSeconds());

      if (!session.valid || !session.role) {
        throw new ApiError(
          session.expired
            ? "Received an expired session token. Please try again."
            : "Invalid authentication token received from server.",
          0,
          "invalid_response",
        );
      }

      if (disposed || authEpoch !== loginEpoch) {
        throw new ApiError("Authentication was superseded.", 0, "aborted");
      }

      if (session.role === "admin") {
        // Never persist privileged admin credentials to mobile SecureStore; keep memory-only for desktop notice.
        await deleteToken().catch(() => {});
      } else {
        await writeToken(response.access_token);
      }

      if (disposed || authEpoch !== loginEpoch) {
        if (session.role === "parent") {
          await clearTokenIfStillMatches(response.access_token);
        }
        throw new ApiError("Authentication was superseded.", 0, "aborted");
      }

      commitState({
        isHydrating: false,
        isLoggedIn: true,
        userRole: session.role,
        userEmail: session.email,
        sessionNotice: null,
      });

      return session.role;
    });
  }

  function logout(): Promise<void> {
    authEpoch += 1;
    explicitLogout = true;

    commitState({
      isHydrating: false,
      isLoggedIn: false,
      userRole: null,
      userEmail: null,
      sessionNotice: null,
    });

    return enqueueAuthOp(async () => {
      await deleteToken();
    });
  }

  function clearSessionNotice(): void {
    if (state.sessionNotice !== null) {
      commitState({ ...state, sessionNotice: null });
    }
  }

  return {
    start,
    login,
    logout,
    clearSessionNotice,
    getState: () => state,
  };
}
