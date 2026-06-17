"use client";

import { useApp } from "@/lib/context/AppContext";
import { AppEvents, parseLoadDraftDetail } from "@/lib/security/events";
import type { DmMessage } from "@/lib/types";
import { formatDateDivider, getAvatarColor } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import HuddleBanner from "./HuddleBanner";
import MessageComposer from "./MessageComposer";
import MessageItem from "./MessageItem";

interface DmFeedProps {
  displayName: string;
  userId: string;
}

export default function DmFeed({ displayName, userId }: DmFeedProps) {
  const { activeDmId, getDm, getDmMessages, addDmMessage, setOpenPanel, startHuddle } = useApp();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dm = activeDmId ? getDm(activeDmId) : undefined;
  const messages = activeDmId ? getDmMessages(activeDmId) : [];

  const feedItems = useMemo(() => {
    const items: Array<
      | { type: "divider"; label: string; key: string }
      | { type: "message"; message: DmMessage; isGrouped: boolean; key: string }
    > = [];
    let lastDate = "";
    let lastUserId = "";
    for (const message of messages) {
      const dateLabel = formatDateDivider(message.created_at);
      if (dateLabel !== lastDate) {
        items.push({ type: "divider", label: dateLabel, key: `d-${dateLabel}` });
        lastDate = dateLabel;
        lastUserId = "";
      }
      const isGrouped = message.user_id === lastUserId;
      items.push({ type: "message", message, isGrouped, key: message.id });
      lastUserId = message.user_id;
    }
    return items;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function onLoadDraft(e: Event) {
      const content = parseLoadDraftDetail((e as CustomEvent).detail);
      if (content) setNewMessage(content);
    }
    document.addEventListener(AppEvents.loadDraft, onLoadDraft);
    return () => document.removeEventListener(AppEvents.loadDraft, onLoadDraft);
  }, []);

  async function handleSend(text: string, file?: File) {
    if (!activeDmId) return;
    if (!text && !file) return;
    await addDmMessage(activeDmId, userId, displayName, text, file);
    setNewMessage("");
  }

  if (!activeDmId || !dm) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white text-[#616061]">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-screen min-w-0">
      <HuddleBanner />
      <header className="px-4 h-[49px] border-b border-[#E8E8E8] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: getAvatarColor(dm.name) }}
          >
            {dm.name.charAt(0)}
          </div>
          <h2 className="font-bold text-[#1D1C1D] text-[18px]">{dm.name}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => dm && startHuddle(dm.name)}
            className="flex items-center px-2 py-1 rounded text-[#616061] hover:bg-[#F8F8F8]"
            title="Start huddle"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </button>
          <button
            onClick={() => setOpenPanel("search")}
            className="flex items-center px-2 py-1 rounded text-[#616061] hover:bg-[#F8F8F8]"
            title="Search"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto slack-scrollbar">
        {feedItems.length === 0 ? (
          <div className="px-5 py-8 text-center text-[#616061]">
            <p className="text-[15px]">This is the beginning of your direct message history with {dm.name}.</p>
          </div>
        ) : (
          feedItems.map((item) =>
            item.type === "divider" ? (
              <div key={item.key} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 h-px bg-[#E8E8E8]" />
                <span className="text-[13px] font-bold text-[#1D1C1D] border border-[#E8E8E8] rounded-full px-3 py-0.5">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-[#E8E8E8]" />
              </div>
            ) : (
              <MessageItem
                key={item.key}
                message={item.message}
                isGrouped={item.isGrouped}
              />
            )
          )
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <MessageComposer
        placeholder={`Message ${dm.name}`}
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSend}
        target={dm.name}
        targetType="dm"
      />
    </div>
  );
}
