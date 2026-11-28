import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ApiError, registerUnauthorizedHandler } from "../services/apiClient.ts";
import { loginApi } from "../services/authApi.ts";
import {
  clearAuthToken,
  getToken,
  setAuthToken,
} from "../services/tokenStorage.ts";
import type { Role } from "../types/index.ts";
import { inspectSessionToken } from "../utils/jwt.ts";

const SESSION_EXPIRED_NOTICE = "Your session expired. Please log in again.";

export interface AuthContextValue {
  isHydrating: boolean;
  isLoggedIn: boolean;
  userRole: Role | null;
  userEmail: string | null;
  sessionNotice: string | null;
  clearSessionNotice: () => void;
  login: (email: string, password: string) => Promise<Role>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Prevents async cold-start hydration from overwriting explicit login/logout/401 updates.
  const authEpochRef = useRef(0);

  const resetSessionState = useCallback((notice: string | null) => {
    setIsLoggedIn(false);
    setUserRole(null);
    setUserEmail(null);
    setSessionNotice(notice);
  }, []);

  useEffect(() => {
    let mounted = true;
    const hydrationEpoch = authEpochRef.current;

    (async () => {
      const token = await getToken();
      const session = inspectSessionToken(token);

      if (!session.valid || !session.role) {
        if (token) {
          await clearAuthToken().catch(() => {});
        }
        if (mounted && authEpochRef.current === hydrationEpoch) {
          resetSessionState(session.expired ? SESSION_EXPIRED_NOTICE : null);
          setIsHydrating(false);
        }
        return;
      }

      if (mounted && authEpochRef.current === hydrationEpoch) {
        setIsLoggedIn(true);
        setUserRole(session.role);
        setUserEmail(session.email);
        setSessionNotice(null);
        setIsHydrating(false);
      }
    })();

    const unsubscribe = registerUnauthorizedHandler(() => {
      if (!mounted) return;
      authEpochRef.current += 1;
      resetSessionState(SESSION_EXPIRED_NOTICE);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [resetSessionState]);

  const clearSessionNotice = useCallback(() => {
    setSessionNotice(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginApi(email, password);
    const session = inspectSessionToken(response.access_token);

    if (!session.valid || !session.role) {
      throw new ApiError(
        session.expired
          ? "Received an expired session token. Please try again."
          : "Invalid authentication token received from server.",
        0,
        "invalid_response",
      );
    }

    await setAuthToken(response.access_token);
    authEpochRef.current += 1;
    setIsLoggedIn(true);
    setUserRole(session.role);
    setUserEmail(session.email);
    setSessionNotice(null);
    setIsHydrating(false);
    return session.role;
  }, []);

  const logout = useCallback(async () => {
    authEpochRef.current += 1;
    resetSessionState(null);
    try {
      await clearAuthToken();
    } catch {
      // UI state must still sign out even if secure storage throws on cleanup.
    }
  }, [resetSessionState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isHydrating,
      isLoggedIn,
      userRole,
      userEmail,
      sessionNotice,
      clearSessionNotice,
      login,
      logout,
    }),
    [
      isHydrating,
      isLoggedIn,
      userRole,
      userEmail,
      sessionNotice,
      clearSessionNotice,
      login,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}
