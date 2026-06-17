"use client";

import ProfileMenu, { ProfileAvatar } from "@/components/ProfileMenu";
import StatusMenu from "@/components/StatusMenu";
import { WorkspaceIcon } from "@/components/WorkspaceMenu";
import { useApp } from "@/lib/context/AppContext";
import type { RailView } from "@/lib/types";
import { showToast } from "@/lib/toast";
import { useRef, useState, type RefObject } from "react";

const RAIL_ITEMS: { id: RailView; label: string; icon: React.FC<{ active?: boolean }> }[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "dms", label: "DMs", icon: DmIcon },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "files", label: "Files", icon: FilesIcon },
  { id: "more", label: "More", icon: MoreIcon },
];

interface IconRailProps {
  displayName: string;
  workspaceRef: RefObject<HTMLButtonElement | null>;
}

export default function IconRail({ displayName, workspaceRef }: IconRailProps) {
  const profileRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLButtonElement>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const {
    railView,
    setRailView,
    setOpenPanel,
    dms,
    openDm,
    channels,
    openChannel,
    refreshDms,
    notificationsPaused,
    setNotificationsPaused,
    profileMenuOpen,
    setProfileMenuOpen,
    workspaceMenuOpen,
    setWorkspaceMenuOpen,
    userStatus,
  } = useApp();

  function handleNav(view: RailView) {
    setRailView(view);
    setOpenPanel(null);
    setProfileMenuOpen(false);
    setWorkspaceMenuOpen(false);
    if (view === "home" && channels[0]) openChannel(channels[0].id);
    if (view === "dms") {
      refreshDms().then((list) => {
        if (list.length > 0) openDm(list[0].id);
      });
    }
  }

  function togglePause() {
    const next = !notificationsPaused;
    setNotificationsPaused(next);
    showToast(next ? "Notifications paused" : "Notifications resumed");
  }

  function toggleProfileMenu() {
    setStatusMenuOpen(false);
    setProfileMenuOpen(!profileMenuOpen);
    setOpenPanel(null);
    setWorkspaceMenuOpen(false);
  }

  function toggleStatusMenu() {
    setProfileMenuOpen(false);
    setStatusMenuOpen(!statusMenuOpen);
    setOpenPanel(null);
    setWorkspaceMenuOpen(false);
  }

  function toggleWorkspaceMenu() {
    setProfileMenuOpen(false);
    setOpenPanel(null);
    setWorkspaceMenuOpen(!workspaceMenuOpen);
  }

  return (
    <>
      <nav className="w-[68px] min-w-[68px] bg-[#4A154B] flex flex-col items-center pt-2 pb-3 shrink-0 h-screen relative z-40">
        <div className="flex flex-col items-center w-full">
          <button
            ref={workspaceRef}
            onClick={toggleWorkspaceMenu}
            title="Slack Clone"
            className={`mb-2 p-1 rounded-[10px] transition-colors ${
              workspaceMenuOpen ? "bg-[#6b2b6d]" : "hover:bg-[#5a1f5c]"
            }`}
          >
            <WorkspaceIcon size="rail" variant="rail" />
          </button>

          {RAIL_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = railView === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className="flex flex-col items-center w-full py-2 px-1 group"
              >
                <div
                  className={`w-9 h-9 rounded-[8px] flex items-center justify-center transition-colors ${
                    active
                      ? "bg-[#6b2b6d] text-white"
                      : "text-white group-hover:bg-[#5a1f5c]"
                  }`}
                >
                  <Icon active={active} />
                </div>
                <span
                  className={`text-[11px] font-medium mt-1 leading-none ${
                    active ? "text-white" : "text-white/90 group-hover:text-white"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="flex flex-col items-center gap-3 w-full px-2">
          <button
            onClick={() => {
              setProfileMenuOpen(false);
              setOpenPanel("quick-add");
            }}
            title="Create"
            className="w-9 h-9 rounded-full bg-[#5a1f5c] hover:bg-[#6b2b6d] flex items-center justify-center text-white transition-colors"
          >
            <PlusIcon />
          </button>

          <button
            onClick={togglePause}
            title={notificationsPaused ? "Resume notifications" : "Pause notifications"}
            aria-label={notificationsPaused ? "Resume notifications" : "Pause notifications"}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors ${
              notificationsPaused ? "bg-[#6b2b6d]" : "bg-[#5a1f5c] hover:bg-[#6b2b6d]"
            }`}
          >
            <MoonIcon />
          </button>

          <div className="relative">
            <button
              ref={profileRef}
              onClick={toggleProfileMenu}
              title={`${displayName} — open profile menu`}
              className={`relative transition-all ${
                profileMenuOpen
                  ? "ring-2 ring-white/60 rounded-[8px]"
                  : "hover:ring-2 hover:ring-white/40 rounded-[8px]"
              }`}
            >
              <ProfileAvatar showStatus />
              {notificationsPaused && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2BAC76] border-2 border-[#4A154B] flex items-center justify-center text-[9px] font-bold text-white pointer-events-none">
                  z
                </span>
              )}
            </button>
            <button
              ref={statusRef}
              type="button"
              onClick={toggleStatusMenu}
              title="Set your status"
              aria-label="Set your status"
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#4A154B] shadow-sm transition-transform hover:scale-110 ${
                statusMenuOpen ? "ring-2 ring-white/70" : ""
              } ${
                userStatus === "active"
                  ? "bg-[#2BAC76]"
                  : userStatus === "dnd"
                    ? "bg-[#E01E5A]"
                    : "bg-[#ABABAD]"
              }`}
            />
          </div>
        </div>
      </nav>

      <StatusMenu
        open={statusMenuOpen}
        onClose={() => setStatusMenuOpen(false)}
        anchorRef={statusRef}
      />

      <ProfileMenu
        displayName={displayName}
        open={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        anchorRef={profileRef}
      />
    </>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      )}
    </svg>
  );
}

function DmIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function ActivityIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function FilesIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function MoreIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.75" opacity={active ? 1 : 0.9} />
      <circle cx="12" cy="12" r="1.75" opacity={active ? 1 : 0.9} />
      <circle cx="19" cy="12" r="1.75" opacity={active ? 1 : 0.9} />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}
