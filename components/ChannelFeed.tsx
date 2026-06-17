"use client";

import { useApp } from "@/lib/context/AppContext";
import { AppEvents, parseLoadDraftDetail } from "@/lib/security/events";
import { buildChannelFeedItems } from "@/lib/messageFeed";
import { useChannelEngagement } from "@/hooks/useChannelEngagement";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import HuddleBanner from "./HuddleBanner";
import MessageComposer from "./MessageComposer";
import MessageItem from "./MessageItem";

interface ChannelFeedProps {
  displayName: string;
  userId: string;
}

export default function ChannelFeed({ displayName, userId }: ChannelFeedProps) {
  const {
    activeChannelId,
    getChannel,
    getChannelMessages,
    addMessage,
    setOpenPanel,
    startHuddle,
    channelMembers,
    searchQuery,
    getChannelLastViewedAt,
    markChannelAsRead,
  } = useApp();
  const [newMessage, setNewMessage] = useState("");
  const [newMessagesDividerAt, setNewMessagesDividerAt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channel = activeChannelId ? getChannel(activeChannelId) : undefined;
  const allMessages = activeChannelId ? getChannelMessages(activeChannelId) : [];
  const messages = searchQuery.trim()
    ? allMessages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMessages;

  useLayoutEffect(() => {
    if (!activeChannelId) {
      setNewMessagesDividerAt(null);
      return;
    }
    setNewMessagesDividerAt(getChannelLastViewedAt(activeChannelId));
  }, [activeChannelId, getChannelLastViewedAt]);

  const feedItems = useMemo(
    () =>
      searchQuery.trim()
        ? buildChannelFeedItems(messages, null)
        : buildChannelFeedItems(messages, newMessagesDividerAt),
    [messages, newMessagesDividerAt, searchQuery]
  );

  const handleChannelEngaged = useCallback(() => {
    if (!activeChannelId) return;
    markChannelAsRead(activeChannelId);
  }, [activeChannelId, markChannelAsRead]);

  const scrollRef = useChannelEngagement(
    activeChannelId,
    allMessages.length,
    handleChannelEngaged
  );

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

  function handleSend(text: string, file?: File) {
    if (!activeChannelId) return;
    if (!text && !file) return;
    addMessage(activeChannelId, userId, displayName, text, file);
    setNewMessage("");
    markChannelAsRead(activeChannelId);
  }

  if (!activeChannelId || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white text-[#616061]">
        Select a channel to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-screen min-w-0">
      <HuddleBanner />
      <header className="px-4 h-[49px] border-b border-[#E8E8E8] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#1D1C1D] font-bold text-[18px]">#</span>
          <h2 className="font-bold text-[#1D1C1D] text-[18px] leading-tight truncate">
            {channel.name}
          </h2>
          <span className="hidden sm:inline text-[13px] text-[#616061] truncate border-l border-[#E8E8E8] pl-2 ml-1">
            {channel.description}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ToolbarButton title="Members" onClick={() => setOpenPanel("members")}>
            <UsersIcon />
            <span className="text-[13px] font-medium ml-1">{channelMembers.length}</span>
          </ToolbarButton>
          <ToolbarButton title="Search" onClick={() => setOpenPanel("search")}>
            <SearchIcon />
          </ToolbarButton>
          <ToolbarButton
            title="Start huddle"
            onClick={() => channel && startHuddle(`#${channel.name}`)}
          >
            <PhoneIcon />
          </ToolbarButton>
          <ToolbarButton title="Channel details" onClick={() => setOpenPanel("channel-info")}>
            <InfoIcon />
          </ToolbarButton>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto slack-scrollbar">
        <div className="px-5 py-6">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-14 h-14 rounded-lg bg-[#E8F5FA] flex items-center justify-center text-[#1264A3] text-2xl font-bold shrink-0">
              #
            </div>
            <div>
              <h3 className="font-bold text-[#1D1C1D] text-[28px] leading-tight mb-1">
                {channel.name}
              </h3>
              <p className="text-[15px] text-[#616061]">
                {channel.description ?? "This is the very beginning of the channel."}
              </p>
            </div>
          </div>
        </div>

        {feedItems.map((item) => {
          if (item.type === "date") {
            return (
              <div key={item.key} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 h-px bg-[#E8E8E8]" />
                <span className="text-[13px] font-bold text-[#1D1C1D] border border-[#E8E8E8] rounded-full px-3 py-0.5">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-[#E8E8E8]" />
              </div>
            );
          }
          if (item.type === "new-messages") {
            return (
              <div
                key={item.key}
                className="flex items-center gap-3 px-5 py-4 my-1"
                role="separator"
                aria-label="New messages"
              >
                <div className="flex-1 h-px bg-[#1264A3]" />
                <span className="text-[12px] font-extrabold uppercase tracking-wide text-[#1264A3] px-2">
                  New messages
                </span>
                <div className="flex-1 h-px bg-[#1264A3]" />
              </div>
            );
          }
          if (item.type === "topic-start") {
            return (
              <div key={item.key} className="px-5 py-2">
                <div className="border-t border-dashed border-[#DDDDDD]" aria-hidden />
              </div>
            );
          }
          return (
            <MessageItem
              key={item.key}
              message={item.message}
              isGrouped={item.isGrouped}
            />
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <MessageComposer
        placeholder={`Message #${channel.name}`}
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSend}
        target={channel.name}
        targetType="channel"
      />
    </div>
  );
}

function ToolbarButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex items-center px-2 py-1 rounded text-[#616061] hover:bg-[#F8F8F8] hover:text-[#1D1C1D] transition-colors"
    >
      {children}
    </button>
  );
}

function UsersIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>;
}
function SearchIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
}
function PhoneIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;
}
function InfoIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
}
