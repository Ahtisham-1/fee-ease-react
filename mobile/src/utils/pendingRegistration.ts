export const PENDING_REGISTRATION_TTL_MS = 5 * 60 * 1000;

interface PendingCredentials {
  email: string;
  password: string;
  createdAt: number;
}

// Held strictly in module memory (never URL params or AsyncStorage) so passwords never leak into navigation logs.
let pendingRegistration: PendingCredentials | null = null;

function normalizeEmail(email: string): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function setPendingRegistration(
  email: string,
  password: string,
  nowMs = Date.now(),
): void {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    pendingRegistration = null;
    return;
  }
  pendingRegistration = {
    email: normalizedEmail,
    password,
    createdAt: nowMs,
  };
}

export function getPendingRegistration(
  email: string,
  nowMs = Date.now(),
): { email: string; password: string } | null {
  if (!pendingRegistration) {
    return null;
  }
  if (nowMs - pendingRegistration.createdAt > PENDING_REGISTRATION_TTL_MS) {
    pendingRegistration = null;
    return null;
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || pendingRegistration.email !== normalizedEmail) {
    return null;
  }
  return {
    email: pendingRegistration.email,
    password: pendingRegistration.password,
  };
}

export function clearPendingRegistration(): void {
  if (pendingRegistration) {
    pendingRegistration = { email: "", password: "", createdAt: 0 };
  }
  pendingRegistration = null;
}
