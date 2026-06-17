const KEY_PREFIX = "slack-clone:active-workspace:";

export function getStoredWorkspaceId(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export function setStoredWorkspaceId(userId: string, workspaceId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${KEY_PREFIX}${userId}`, workspaceId);
  } catch {
    // ignore quota errors
  }
}
