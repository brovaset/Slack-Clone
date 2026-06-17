"use client";

import { useApp } from "@/lib/context/AppContext";
import type { UserStatus } from "@/lib/types";
import { showToast } from "@/lib/toast";
import { useEffect, useRef } from "react";

interface StatusMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const STATUS_OPTIONS: { id: UserStatus; label: string; hint: string }[] = [
  { id: "active", label: "Active", hint: "Available" },
  { id: "away", label: "Away", hint: "Be right back" },
  { id: "dnd", label: "Do not disturb", hint: "Pause notifications" },
];

export default function StatusMenu({ open, onClose, anchorRef }: StatusMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    userStatus,
    setUserStatus,
    customStatus,
    setCustomStatus,
    setNotificationsPaused,
  } = useApp();

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
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

  if (!open) return null;

  function pickStatus(status: UserStatus) {
    setUserStatus(status);
    if (status === "dnd") setNotificationsPaused(true);
    showToast(`Status set to ${STATUS_OPTIONS.find((s) => s.id === status)?.label}`);
    onClose();
  }

  return (
    <div
      ref={menuRef}
      className="fixed left-[68px] bottom-14 z-50 w-[280px] bg-white rounded-lg shadow-[0_0_0_1px_rgba(29,28,29,0.13),0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#E8E8E8]">
        <p className="text-[13px] font-bold text-[#616061] uppercase tracking-wide">
          Set a status
        </p>
      </div>
      <ul className="py-1">
        {STATUS_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => pickStatus(opt.id)}
              className={`w-full text-left px-4 py-2.5 hover:bg-[#1264A3]/10 flex items-center justify-between ${
                userStatus === opt.id ? "bg-[#E8F5FA]" : ""
              }`}
            >
              <span className="text-[15px] font-medium text-[#1D1C1D]">{opt.label}</span>
              <span className="text-[12px] text-[#616061]">{opt.hint}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="px-4 py-3 border-t border-[#E8E8E8]">
        <input
          type="text"
          value={customStatus}
          onChange={(e) => setCustomStatus(e.target.value)}
          placeholder="What's your status?"
          maxLength={100}
          className="w-full px-3 py-2 border border-[#E2E2E2] rounded-md text-[14px] focus:outline-none focus:border-[#1264A3]"
        />
      </div>
    </div>
  );
}

export function StatusDot({
  status,
  className = "",
}: {
  status: UserStatus;
  className?: string;
}) {
  const color =
    status === "active"
      ? "bg-[#2BAC76]"
      : status === "dnd"
        ? "bg-[#E01E5A]"
        : "bg-[#ABABAD]";

  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#4A154B] ${color} ${className}`}
      aria-hidden
    />
  );
}
