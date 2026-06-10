import {
  RATE_LIMITS,
  checkRateLimit,
  sanitizeDisplayName,
  sanitizeEmail,
} from "@/lib/security";

export interface MockUser {
  id: string;
  displayName: string;
  email: string;
}

const STORAGE_KEY = "slack-clone-user";

function isValidUser(value: unknown): value is MockUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    user.id.length <= 64 &&
    typeof user.displayName === "string" &&
    user.displayName.length <= 80 &&
    typeof user.email === "string" &&
    user.email.length <= 254
  );
}

export function getUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidUser(parsed)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setUser(user: MockUser) {
  const safeUser: MockUser = {
    id: user.id.slice(0, 64),
    displayName: sanitizeDisplayName(user.displayName) ?? "User",
    email: sanitizeEmail(user.email) ?? "user@example.com",
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
}

export function clearUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function createUser(
  displayName: string,
  email: string
): { user: MockUser } | { error: string } {
  const rate = checkRateLimit(
    "auth:create",
    RATE_LIMITS.auth.max,
    RATE_LIMITS.auth.windowMs
  );
  if (!rate.allowed) {
    return { error: "Too many sign-in attempts. Try again later." };
  }

  const safeName = sanitizeDisplayName(displayName);
  const safeEmail = sanitizeEmail(email);
  if (!safeName) return { error: "Enter a valid display name." };
  if (!safeEmail) return { error: "Enter a valid email address." };

  return {
    user: {
      id: `user-${Date.now()}`,
      displayName: safeName,
      email: safeEmail,
    },
  };
}
