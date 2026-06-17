export interface ChannelReadEntry {
  lastViewedAt: string;
  lastViewedMessageId?: string;
}

export type ChannelReadMap = Record<string, ChannelReadEntry>;

const STORAGE_KEY = "slack-clone-channel-read";

function storageKey(userId: string) {
  return `${STORAGE_KEY}:${userId}`;
}

export function loadChannelReadState(userId: string): ChannelReadMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ChannelReadMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChannelReadState(userId: string, state: ChannelReadMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function mergeReadStates(
  local: ChannelReadMap,
  remote: ChannelReadMap
): ChannelReadMap {
  const merged = { ...local };
  for (const [channelId, entry] of Object.entries(remote)) {
    const existing = merged[channelId];
    if (!existing || entry.lastViewedAt > existing.lastViewedAt) {
      merged[channelId] = entry;
    }
  }
  return merged;
}

export function getLastMessageTimestamp(
  channelMessages: { created_at: string }[]
): string | null {
  if (channelMessages.length === 0) return null;
  return channelMessages[channelMessages.length - 1].created_at;
}

export function countUnreadMessages(
  channelMessages: { id: string; created_at: string }[],
  lastViewedAt: string | null,
  lastViewedMessageId?: string | null
): number {
  if (channelMessages.length === 0) return 0;
  if (!lastViewedAt) return channelMessages.length;

  if (lastViewedMessageId) {
    const idx = channelMessages.findIndex((m) => m.id === lastViewedMessageId);
    if (idx >= 0) return channelMessages.length - idx - 1;
  }

  return channelMessages.filter((m) => m.created_at > lastViewedAt).length;
}

export function isChannelUnread(
  channelMessages: { id: string; created_at: string }[],
  lastViewedAt: string | null,
  lastViewedMessageId?: string | null
): boolean {
  return countUnreadMessages(channelMessages, lastViewedAt, lastViewedMessageId) > 0;
}
