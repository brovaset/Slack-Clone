import { sanitizeDraftContent } from "./sanitize";

const APP_EVENT_PREFIX = "slack-clone:";

export const AppEvents = {
  toast: `${APP_EVENT_PREFIX}toast`,
  loadDraft: `${APP_EVENT_PREFIX}load-draft`,
  openCreateChannel: `${APP_EVENT_PREFIX}open-create-channel`,
} as const;

export function dispatchAppEvent(
  name: string,
  detail?: unknown
): void {
  if (typeof document === "undefined") return;
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function dispatchLoadDraft(content: string): void {
  const sanitized = sanitizeDraftContent(content);
  if (!sanitized) return;
  dispatchAppEvent(AppEvents.loadDraft, sanitized);
}

export function parseLoadDraftDetail(detail: unknown): string | null {
  if (typeof detail !== "string") return null;
  return sanitizeDraftContent(detail);
}
