"use client";

import { showToast } from "@/lib/toast";
import { useEffect, useRef, useState, type RefObject } from "react";

export const WORKSPACE_NAME = "Slack Clone";
export const WORKSPACE_URL = "slack-clone.slack.com";

interface WorkspaceMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRefs: RefObject<HTMLElement | null>[];
}

export default function WorkspaceMenu({
  open,
  onClose,
  anchorRefs,
}: WorkspaceMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        anchorRefs.some((ref) => ref.current?.contains(target))
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
  }, [open, onClose, anchorRefs]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="fixed left-[68px] top-2 z-50 w-[280px] bg-white rounded-lg shadow-[0_0_0_1px_rgba(29,28,29,0.13),0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden py-1"
    >
      <button
        type="button"
        onClick={() => {
          onClose();
          showToast(`Switched to ${WORKSPACE_NAME}`);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1264A3]/10 transition-colors text-left"
      >
        <WorkspaceIcon size="lg" selected />
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[#1D1C1D] leading-tight truncate">
            {WORKSPACE_NAME}
          </p>
          <p className="text-[13px] text-[#616061] leading-tight truncate">
            {WORKSPACE_URL}
          </p>
        </div>
      </button>

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1264A3]/10 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-[4px] border border-[#E2E2E2] bg-[#F8F8F8] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#1D1C1D]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-[15px] text-[#1D1C1D]">Add a workspace</span>
        </button>
      ) : (
        <div className="px-4 py-3 space-y-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name"
            className="w-full px-3 py-2 border border-[#868686] rounded text-[15px] focus:outline-none focus:border-[#1264A3]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (name.trim()) {
                  showToast(`Workspace "${name.trim()}" added`);
                  setName("");
                  setAdding(false);
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-[#007A5A] text-white text-[13px] font-bold rounded"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setName("");
              }}
              className="px-3 py-1.5 text-[#616061] text-[13px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkspaceIcon({
  size = "sm",
  selected,
  variant = "sidebar",
}: {
  size?: "sm" | "lg" | "rail";
  selected?: boolean;
  variant?: "sidebar" | "rail";
}) {
  const dims =
    size === "rail" || size === "lg"
      ? "w-9 h-9"
      : "w-[22px] h-[22px]";
  const border =
    variant === "rail"
      ? "border-2 border-white/90"
      : selected
        ? "border-2 border-[#1264A3]"
        : "border border-[#E2E2E2]";
  const radius = variant === "rail" ? "rounded-[8px]" : "rounded-[4px]";
  const logoSize =
    size === "rail" || size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";

  return (
    <div
      className={`${dims} ${radius} ${border} bg-[#1D1C1D] flex items-center justify-center shrink-0 overflow-hidden`}
    >
      <svg
        className={logoSize}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A" />
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0" />
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E" />
      </svg>
    </div>
  );
}
