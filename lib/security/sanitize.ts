import { CHANNEL_NAME_PATTERN, LIMITS } from "./constants";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, "");
}

export function truncate(value: string, max: number): string {
  return stripControlChars(value).trim().slice(0, max);
}

export function sanitizeMessage(content: string): string | null {
  const cleaned = truncate(content, LIMITS.message);
  return cleaned.length > 0 ? cleaned : null;
}

export function sanitizeChannelName(name: string): string | null {
  const normalized = stripControlChars(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, LIMITS.channelName);

  if (!normalized || !CHANNEL_NAME_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

export function sanitizeChannelDescription(description: string): string | null {
  const cleaned = truncate(description, LIMITS.channelDescription);
  return cleaned.length > 0 ? cleaned : null;
}

export function sanitizeDisplayName(name: string): string | null {
  const cleaned = truncate(name, LIMITS.displayName);
  if (!cleaned || cleaned.length < 1) return null;
  return cleaned;
}

export function sanitizeEmail(email: string): string | null {
  const cleaned = truncate(email, LIMITS.email).toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(cleaned) ? cleaned : null;
}

export function sanitizeStatus(status: string): string {
  return truncate(status, LIMITS.status);
}

export function sanitizeSearchQuery(query: string): string {
  return truncate(query, LIMITS.searchQuery);
}

export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const cleaned = stripControlChars(base).replace(/[<>:"|?*]/g, "");
  return truncate(cleaned, LIMITS.fileName) || "file";
}

export function sanitizeWorkspaceName(name: string): string | null {
  const cleaned = truncate(name, LIMITS.workspaceName);
  return cleaned.length > 0 ? cleaned : null;
}

export function sanitizeDraftContent(content: string): string | null {
  return sanitizeMessage(content);
}
