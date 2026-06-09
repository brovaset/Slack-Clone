"use client";

import { clearUser } from "@/lib/auth";
import { useApp } from "@/lib/context/AppContext";
import { getAvatarColor } from "@/lib/utils";
import type { Channel } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreateChannelModal from "./CreateChannelModal";

interface SidebarProps {
  displayName: string;
  userId: string;
}

export default function Sidebar({ displayName }: SidebarProps) {
  const router = useRouter();
  const {
    channels,
    dms,
    activeChannelId,
    activeDmId,
    railView,
    openChannel,
    openDm,
    setOpenPanel,
    userStatus,
  } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);

  useEffect(() => {
    function onCreateChannel() {
      setShowCreateModal(true);
    }
    document.addEventListener("slack:open-create-channel", onCreateChannel);
    return () => document.removeEventListener("slack:open-create-channel", onCreateChannel);
  }, []);

  function handleLogout() {
    clearUser();
    router.push("/login");
  }

  function handleChannelCreated(channel: Channel) {
    openChannel(channel.id);
  }

  const statusLabel =
    userStatus === "dnd" ? "Do not disturb" : userStatus.charAt(0).toUpperCase() + userStatus.slice(1);

  return (
    <>
      <aside className="w-[260px] min-w-[260px] bg-[#3F0E40] text-[#D1D2D3] flex flex-col h-screen">
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => setOpenPanel("workspace")}
            className="w-full flex items-center justify-between font-bold text-white text-[18px] hover:bg-[#350D36] px-2 py-1.5 rounded-md transition-colors shadow-sm"
          >
            <span className="truncate">Acme Corp</span>
            <ChevronDown />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={() => setOpenPanel("threads")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[#D1D2D3] hover:bg-[#350D36] text-[15px] transition-colors"
          >
            <WriteIcon />
            <span>Threads</span>
          </button>
          <button
            onClick={() => setOpenPanel("huddles")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[#D1D2D3] hover:bg-[#350D36] text-[15px] transition-colors"
          >
            <HeadphonesIcon />
            <span>Huddles</span>
          </button>
          <button
            onClick={() => setOpenPanel("drafts")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[#D1D2D3] hover:bg-[#350D36] text-[15px] transition-colors"
          >
            <SendIcon />
            <span>Drafts &amp; sent</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 slack-scrollbar">
          {(railView === "home" || railView === "dms") && (
            <>
              {railView === "home" && (
                <SidebarSection
                  title="Channels"
                  isOpen={channelsOpen}
                  onToggle={() => setChannelsOpen(!channelsOpen)}
                  onAdd={() => setShowCreateModal(true)}
                >
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => openChannel(channel.id)}
                      className={`w-full text-left px-2 py-[3px] rounded-md text-[15px] truncate transition-colors flex items-center gap-0.5 ${
                        activeChannelId === channel.id
                          ? "bg-[#1164A3] text-white"
                          : "text-[#D1D2D3] hover:bg-[#350D36]"
                      }`}
                    >
                      <span className="opacity-80 mr-0.5">#</span>
                      {channel.name}
                    </button>
                  ))}
                </SidebarSection>
              )}

              {(railView === "home" || railView === "dms") && (
                <SidebarSection
                  title="Direct messages"
                  isOpen={dmsOpen}
                  onToggle={() => setDmsOpen(!dmsOpen)}
                  onAdd={() => dms[0] && openDm(dms[0].id)}
                >
                  {dms.map((dm) => (
                    <button
                      key={dm.id}
                      onClick={() => openDm(dm.id)}
                      className={`w-full text-left px-2 py-[3px] rounded-md text-[15px] truncate transition-colors flex items-center gap-2 ${
                        activeDmId === dm.id && railView === "dms"
                          ? "bg-[#1164A3] text-white"
                          : "text-[#D1D2D3] hover:bg-[#350D36]"
                      }`}
                    >
                      <span className="relative shrink-0">
                        <span
                          className="w-[20px] h-[20px] rounded flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: getAvatarColor(dm.name) }}
                        >
                          {dm.name.charAt(0)}
                        </span>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#3F0E40] ${
                            dm.status === "active" ? "bg-[#2BAC76]" : "bg-transparent border-[#ABABAD]"
                          }`}
                        />
                      </span>
                      <span className="truncate">{dm.name}</span>
                    </button>
                  ))}
                </SidebarSection>
              )}
            </>
          )}

          {railView === "activity" && (
            <p className="px-2 py-4 text-[13px] text-[#ABABAD]">
              Activity shown in main panel →
            </p>
          )}
          {railView === "files" && (
            <p className="px-2 py-4 text-[13px] text-[#ABABAD]">
              Files shown in main panel →
            </p>
          )}
          {railView === "more" && (
            <p className="px-2 py-4 text-[13px] text-[#ABABAD]">
              Apps shown in main panel →
            </p>
          )}
        </div>

        <div className="px-3 py-2.5 border-t border-[#522653] flex items-center gap-2 hover:bg-[#350D36] transition-colors group">
          <button
            onClick={() => setOpenPanel("profile")}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            <div className="relative shrink-0">
              <div
                className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: getAvatarColor(displayName) }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#3F0E40] ${
                  userStatus === "active"
                    ? "bg-[#2BAC76]"
                    : userStatus === "dnd"
                      ? "bg-[#E01E5A]"
                      : "bg-transparent border-[#ABABAD]"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-white truncate leading-tight">{displayName}</p>
              <p className="text-[13px] text-[#D1D2D3] leading-tight">{statusLabel}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="text-[#D1D2D3] hover:text-white shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Sign out"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleChannelCreated}
      />
    </>
  );
}

function SidebarSection({
  title,
  isOpen,
  onToggle,
  onAdd,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-1 mb-0.5 group">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-[15px] font-medium text-[#D1D2D3] hover:text-white transition-colors"
        >
          <ChevronRight className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
          {title}
        </button>
        {onAdd && (
          <button
            onClick={onAdd}
            className="text-[#D1D2D3] hover:text-white w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title={`Add ${title.toLowerCase()}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      {isOpen && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

function ChevronDown() {
  return <svg className="w-4 h-4 shrink-0 opacity-80" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
}
function ChevronRight({ className = "" }: { className?: string }) {
  return <svg className={`w-3 h-3 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
}
function WriteIcon() {
  return <svg className="w-4 h-4 opacity-80" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
}
function HeadphonesIcon() {
  return <svg className="w-4 h-4 opacity-80" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v4a4 4 0 004 4h1v-2H6a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2h-1v2h1a4 4 0 004-4V7a2 2 0 00-2-2H4z" clipRule="evenodd" /></svg>;
}
function SendIcon() {
  return <svg className="w-4 h-4 opacity-80" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
}
function LogoutIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>;
}
