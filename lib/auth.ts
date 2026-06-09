export interface MockUser {
  id: string;
  displayName: string;
  email: string;
}

const STORAGE_KEY = "slack-clone-user";

export function getUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function setUser(user: MockUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function createUser(displayName: string, email: string): MockUser {
  return {
    id: `user-${Date.now()}`,
    displayName,
    email,
  };
}
