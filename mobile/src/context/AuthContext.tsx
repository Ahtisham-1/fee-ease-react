import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import type { Role } from "../types/index";
import {
  createAuthController,
  type AuthController,
  type AuthState,
} from "./authController";

export interface AuthContextValue extends AuthState {
  clearSessionNotice: () => void;
  login: (email: string, password: string) => Promise<Role>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const controllerRef = useRef<AuthController | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    isHydrating: true,
    isLoggedIn: false,
    userRole: null,
    userEmail: null,
    sessionNotice: null,
  });

  if (!controllerRef.current) {
    controllerRef.current = createAuthController({
      onStateChange: setAuthState,
    });
  }

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    return controller.start();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const controller = controllerRef.current!;
    return {
      ...authState,
      clearSessionNotice: controller.clearSessionNotice,
      login: controller.login,
      logout: controller.logout,
    };
  }, [authState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}
