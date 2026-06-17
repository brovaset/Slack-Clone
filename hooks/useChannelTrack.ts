"use client";

import {
  type ChannelReadMap,
  countUnreadMessages,
  getLastMessageTimestamp,
  isChannelUnread,
  loadChannelReadState,
  mergeReadStates,
  saveChannelReadState,
} from "@/lib/channelReadState";
import { fetchChannelReadState, persistChannelRead } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ChannelUnreadInfo {
  isUnread: boolean;
  unreadCount: number;
  hasActivity: boolean;
  lastMessageAt: string | null;
}

export function useChannelTrack(userId: string | undefined, messages: Message[]) {
  const [readState, setReadState] = useState<ChannelReadMap>({});
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

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

  const applyReadEntry = useCallback(
    (channelId: string, entry: ChannelReadMap[string]) => {
      setReadState((prev) => {
        const existing = prev[channelId];
        if (existing && entry.lastViewedAt <= existing.lastViewedAt) return prev;
        const next = { ...prev, [channelId]: entry };
        if (userId) saveChannelReadState(userId, next);
        return next;
      });
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) {
      setReadState({});
      return;
    }

    const local = loadChannelReadState(userId);
    setReadState(local);

    fetchChannelReadState()
      .then((remote) => {
        const merged = mergeReadStates(local, remote);
        setReadState(merged);
        saveChannelReadState(userId, merged);
      })
      .catch(() => {
        // Remote read state unavailable until migration 010 is applied.
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`channel-read-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channel_read_state",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            channel_id?: string;
            last_viewed_at?: string;
            last_viewed_message_id?: string | null;
          };
          if (!row?.channel_id || !row.last_viewed_at) return;
          applyReadEntry(row.channel_id, {
            lastViewedAt: row.last_viewed_at,
            lastViewedMessageId: row.last_viewed_message_id ?? undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, applyReadEntry]);

  const markChannelRead = useCallback(
    (channelId: string, at?: string, messageId?: string) => {
      if (!userId) return;

      const channelMessages = messagesByChannel.get(channelId) ?? [];
      const latest = channelMessages[channelMessages.length - 1];
      const timestamp = at ?? latest?.created_at ?? new Date().toISOString();
      const id = messageId ?? latest?.id;

      setReadState((prev) => {
        const existing = prev[channelId];
        if (existing && timestamp <= existing.lastViewedAt) return prev;

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

      persistQueueRef.current = persistQueueRef.current
        .then(() => persistChannelRead(channelId, timestamp, id))
        .catch(() => {
          // Ignore if migration 010 not applied yet; localStorage still works.
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
      const entry = readState[channelId];
      const lastViewedAt = entry?.lastViewedAt ?? null;
      const lastViewedMessageId = entry?.lastViewedMessageId ?? null;
      const unreadCount = countUnreadMessages(
        channelMessages,
        lastViewedAt,
        lastViewedMessageId
      );
      const isUnread = isChannelUnread(
        channelMessages,
        lastViewedAt,
        lastViewedMessageId
      );

      return {
        isUnread,
        unreadCount,
        hasActivity: Boolean(lastMessageAt),
        lastMessageAt,
      };
    },
    [messagesByChannel, readState]
  );

  const channelUnreadMap = useMemo(() => {
    const map: Record<string, ChannelUnreadInfo> = {};
    for (const channelId of messagesByChannel.keys()) {
      map[channelId] = getChannelUnreadInfo(channelId);
    }
    return map;
  }, [messagesByChannel, getChannelUnreadInfo]);

  return {
    readState,
    markChannelRead,
    getLastViewedAt,
    getChannelUnreadInfo,
    channelUnreadMap,
  };
}
