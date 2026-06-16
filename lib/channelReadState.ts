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

export function getLastMessageTimestamp(
  channelMessages: { created_at: string }[]
): string | null {
  if (channelMessages.length === 0) return null;
  return channelMessages[channelMessages.length - 1].created_at;
}

export function countUnreadMessages(
  channelMessages: { created_at: string }[],
  lastViewedAt: string | null
): number {
  if (channelMessages.length === 0) return 0;
  if (!lastViewedAt) return channelMessages.length;
  return channelMessages.filter((m) => m.created_at > lastViewedAt).length;
}

export function isChannelUnread(
  channelMessages: { created_at: string }[],
  lastViewedAt: string | null
): boolean {
  const lastAt = getLastMessageTimestamp(channelMessages);
  if (!lastAt) return false;
  if (!lastViewedAt) return true;
  return lastAt > lastViewedAt;
}
