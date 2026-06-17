"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

export const CHANNEL_READ_DWELL_MS = 2000;
export const CHANNEL_READ_SCROLL_PX = 80;
export const CHANNEL_READ_NEAR_BOTTOM_PX = 120;

/**
 * Marks a channel read only after the user dwells or scrolls the feed —
 * not on channel selection alone (fast-click-through stays unread).
 */
export function useChannelEngagement(
  channelId: string | null,
  messageCount: number,
  onEngaged: () => void
) {
  const engagedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onEngagedRef = useRef(onEngaged);
  onEngagedRef.current = onEngaged;

  useEffect(() => {
    engagedRef.current = false;
    if (!channelId) return;

    let cancelled = false;
    const dwellTimer = window.setTimeout(() => {
      if (cancelled || engagedRef.current) return;
      engagedRef.current = true;
      onEngagedRef.current();
    }, CHANNEL_READ_DWELL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(dwellTimer);
    };
  }, [channelId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !channelId) return;

    const markEngaged = () => {
      if (engagedRef.current) return;
      engagedRef.current = true;
      onEngagedRef.current();
    };

    const onScroll = () => {
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < CHANNEL_READ_NEAR_BOTTOM_PX;
      const scrolled = el.scrollTop > CHANNEL_READ_SCROLL_PX;
      if (scrolled || nearBottom) markEngaged();
    };

    el.addEventListener("scroll", onScroll, { passive: true });

    if (
      messageCount === 0 &&
      el.scrollHeight <= el.clientHeight + CHANNEL_READ_NEAR_BOTTOM_PX
    ) {
      markEngaged();
    }

    return () => el.removeEventListener("scroll", onScroll);
  }, [channelId, messageCount]);

  useEffect(() => {
    if (!channelId || !engagedRef.current) return;
    onEngagedRef.current();
  }, [channelId, messageCount]);

  return scrollRef;
}
