import type { Message } from "@/lib/types";
import { formatDateDivider } from "@/lib/utils";

export const MESSAGE_GROUP_WINDOW_MS = 2 * 60 * 1000;
export const TOPIC_GAP_MS = 30 * 60 * 1000;

export type ChannelFeedItem =
  | { type: "date"; label: string; key: string }
  | { type: "new-messages"; key: string }
  | { type: "topic-start"; key: string }
  | { type: "message"; message: Message; isGrouped: boolean; key: string };

function msBetween(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

function shouldGroupWithPrevious(prev: Message, current: Message): boolean {
  if (prev.user_id !== current.user_id) return false;
  return msBetween(prev.created_at, current.created_at) <= MESSAGE_GROUP_WINDOW_MS;
}

function isTopicBreak(prev: Message, current: Message): boolean {
  return msBetween(prev.created_at, current.created_at) > TOPIC_GAP_MS;
}

export function buildChannelFeedItems(
  messages: Message[],
  lastViewedAt: string | null
): ChannelFeedItem[] {
  const items: ChannelFeedItem[] = [];
  let lastDate = "";
  let prevMessage: Message | null = null;
  let newMessagesDividerInserted = false;

  for (const message of messages) {
    const dateLabel = formatDateDivider(message.created_at);
    if (dateLabel !== lastDate) {
      items.push({ type: "date", label: dateLabel, key: `d-${dateLabel}` });
      lastDate = dateLabel;
      prevMessage = null;
    }

    if (
      lastViewedAt &&
      !newMessagesDividerInserted &&
      message.created_at > lastViewedAt
    ) {
      items.push({ type: "new-messages", key: `new-${message.id}` });
      newMessagesDividerInserted = true;
    }

    if (prevMessage && isTopicBreak(prevMessage, message)) {
      items.push({ type: "topic-start", key: `topic-${message.id}` });
    }

    const isGrouped = prevMessage ? shouldGroupWithPrevious(prevMessage, message) : false;
    items.push({ type: "message", message, isGrouped, key: message.id });
    prevMessage = message;
  }

  return items;
}
