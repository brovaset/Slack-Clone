"use client";

import {
  type ChannelReadMap,
  countUnreadMessages,
  getLastMessageTimestamp,
  isChannelUnread,
  loadChannelReadState,
  saveChannelReadState,
} from "@/lib/channelReadState";
import type { Message } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface ChannelUnreadInfo {
  isUnread: boolean;
  unreadCount: number;
  hasActivity: boolean;
  lastMessageAt: string | null;
}

export function useChannelTrack(
  userId: string | undefined,
  messages: Message[],
  activeChannelId: string | null
) {
  const [readState, setReadState] = useState<ChannelReadMap>({});

  useEffect(() => {
    if (!userId) {
      setReadState({});
      return;
    }
    setReadState(loadChannelReadState(userId));
  }, [userId]);

  const messagesByChannel = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const message of messages) {
      const list = map.get(message.channel_id);
      if (list) list.push(message);
      else map.set(message.channel_id, [message]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return map;
  }, [messages]);

  const markChannelRead = useCallback(
    (channelId: string, at?: string, messageId?: string) => {
      if (!userId) return;
      const channelMessages = messagesByChannel.get(channelId) ?? [];
      const latest = channelMessages[channelMessages.length - 1];
      const timestamp = at ?? latest?.created_at ?? new Date().toISOString();
      const id = messageId ?? latest?.id;

      setReadState((prev) => {
        const next = {
          ...prev,
          [channelId]: {
            lastViewedAt: timestamp,
            lastViewedMessageId: id,
          },
        };
        saveChannelReadState(userId, next);
        return next;
      });
    },
    [userId, messagesByChannel]
  );

  const getLastViewedAt = useCallback(
    (channelId: string): string | null => {
      return readState[channelId]?.lastViewedAt ?? null;
    },
    [readState]
  );

  const getChannelUnreadInfo = useCallback(
    (channelId: string): ChannelUnreadInfo => {
      const channelMessages = messagesByChannel.get(channelId) ?? [];
      const lastMessageAt = getLastMessageTimestamp(channelMessages);
      const lastViewedAt = readState[channelId]?.lastViewedAt ?? null;
      const isActive = channelId === activeChannelId;
      const unreadCount = isActive
        ? 0
        : countUnreadMessages(channelMessages, lastViewedAt);
      const isUnread = isActive
        ? false
        : isChannelUnread(channelMessages, lastViewedAt);

      return {
        isUnread,
        unreadCount,
        hasActivity: Boolean(lastMessageAt),
        lastMessageAt,
      };
    },
    [messagesByChannel, readState, activeChannelId]
  );

  const channelUnreadMap = useMemo(() => {
    const map: Record<string, ChannelUnreadInfo> = {};
    for (const channelId of messagesByChannel.keys()) {
      map[channelId] = getChannelUnreadInfo(channelId);
    }
    return map;
  }, [messagesByChannel, getChannelUnreadInfo]);

  useEffect(() => {
    if (!activeChannelId || !userId) return;
    const channelMessages = messagesByChannel.get(activeChannelId) ?? [];
    if (channelMessages.length === 0) {
      markChannelRead(activeChannelId);
      return;
    }
    const latest = channelMessages[channelMessages.length - 1];
    markChannelRead(activeChannelId, latest.created_at, latest.id);
  }, [activeChannelId, messages, userId, messagesByChannel, markChannelRead]);

  return {
    readState,
    markChannelRead,
    getLastViewedAt,
    getChannelUnreadInfo,
    channelUnreadMap,
  };
}
