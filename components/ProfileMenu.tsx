"use client";

import { WORKSPACE_NAME } from "@/components/WorkspaceMenu";
import { clearUser } from "@/lib/auth";
import { useApp } from "@/lib/context/AppContext";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";

interface ProfileMenuProps {
  displayName: string;
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
}

export default function ProfileMenu({
  displayName,
  open,
  onClose,
  anchorRef,
}: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {
    userStatus,
    setUserStatus,
    notificationsPaused,
    setNotificationsPaused,
    customStatus,
    setCustomStatus,
    setOpenPanel,
    setProfileMenuOpen,
  } = useApp();
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState(customStatus);

  const presenceLabel =
    customStatus.trim() ||
    (userStatus === "away" ? "Away" : "Active");

  useEffect(() => {
    if (!open) {
      setEditingStatus(false);
      return;
    }
    setStatusDraft(customStatus);
  }, [open, customStatus]);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, anchorRef]);

  function handleSignOut() {
    clearUser();
    onClose();
    router.push("/login");
  }

  function toggleAway() {
    setUserStatus(userStatus === "away" ? "active" : "away");
    onClose();
  }

  function toggleNotifications() {
    setNotificationsPaused(!notificationsPaused);
    showToast(
      notificationsPaused ? "Notifications resumed" : "Notifications paused"
    );
    onClose();
  }

  function openPanel(panel: "profile" | "preferences" | "downloads") {
    setProfileMenuOpen(false);
    setOpenPanel(panel);
    onClose();
  }

  function saveStatus() {
    setCustomStatus(statusDraft.trim());
    setEditingStatus(false);
    showToast(statusDraft.trim() ? "Status updated" : "Status cleared");
  }

  function startStatusEdit() {
    setEditingStatus(true);
    requestAnimationFrame(() => statusInputRef.current?.focus());
  }

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="fixed left-[68px] bottom-3 z-50 w-[300px] bg-white rounded-lg shadow-[0_0_0_1px_rgba(29,28,29,0.13),0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden"
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <ProfileAvatar size="lg" />
          <div className="min-w-0 pt-0.5">
            <p className="text-[18px] font-bold text-[#1D1C1D] leading-tight truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {notificationsPaused && <SnoozeBadge />}
              <span className="text-[13px] text-[#616061]">{presenceLabel}</span>
            </div>
          </div>
        </div>

        {editingStatus ? (
          <div className="mt-4 flex gap-2">
            <input
              ref={statusInputRef}
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveStatus();
                if (e.key === "Escape") setEditingStatus(false);
              }}
              placeholder="What's your status?"
              className="flex-1 px-3 py-2 border border-[#1264A3] rounded-md text-[15px] focus:outline-none"
            />
            <button
              type="button"
              onClick={saveStatus}
              className="px-3 py-2 bg-[#007A5A] text-white text-[13px] font-bold rounded-md hover:bg-[#148567]"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startStatusEdit}
            className="mt-4 w-full flex items-center gap-2 px-3 py-2 border border-[#E2E2E2] rounded-md text-left hover:border-[#ABABAD] transition-colors"
          >
            <SmileIcon />
            <span className="text-[15px] text-[#616061]">
              {customStatus.trim() || "Update your status"}
            </span>
          </button>
        )}
      </div>

      <MenuDivider />

      <MenuItem onClick={toggleAway}>
        Set yourself as <strong>{userStatus === "away" ? "active" : "away"}</strong>
      </MenuItem>
      <MenuItem onClick={toggleNotifications}>
        <span>Notifications</span>
        <span className="text-[#616061]">
          {notificationsPaused ? "Paused" : "On"} &gt;
        </span>
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={() => openPanel("profile")}>Profile</MenuItem>
      <MenuItem onClick={() => openPanel("preferences")}>
        <span>Preferences</span>
        <Shortcut keys={["⌘", ","]} />
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={() => openPanel("downloads")}>
        <span>Downloads</span>
        <Shortcut keys={["⌘", "⇧", "J"]} />
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={handleSignOut}>
        Sign out of {WORKSPACE_NAME}
      </MenuItem>
    </div>
  );
}

export function ProfileAvatar({ size = "sm" }: { size?: "sm" | "lg" }) {
  const dims = size === "lg" ? "w-9 h-9" : "w-9 h-9";
  return (
    <div
      className={`${dims} rounded-[8px] bg-[#5B2C6F] text-white flex items-center justify-center shrink-0`}
    >
      <PersonIcon className={size === "lg" ? "w-5 h-5" : "w-[18px] h-[18px]"} />
    </div>
  );
}

export function SnoozeBadge() {
  return (
    <span className="w-[18px] h-[18px] rounded-full bg-[#2BAC76] flex items-center justify-center text-[10px] font-bold text-white leading-none">
      z
    </span>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-2.5 text-[15px] text-[#1D1C1D] hover:bg-[#1264A3]/10 transition-colors text-left"
    >
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="h-px bg-[#E2E2E2] mx-4" />;
}

function Shortcut({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-0.5 text-[13px] text-[#616061]">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-[20px] h-5 px-1 flex items-center justify-center rounded border border-[#E2E2E2] bg-[#F8F8F8] text-[11px] font-medium"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg className="w-5 h-5 text-[#616061] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="9" cy="10" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
