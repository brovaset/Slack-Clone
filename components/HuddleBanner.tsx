"use client";

import { useApp } from "@/lib/context/AppContext";

export default function HuddleBanner() {
  const { huddleActive, huddleLabel, endHuddle } = useApp();

  if (!huddleActive || !huddleLabel) return null;

  return (
    <div className="px-4 py-2 bg-[#E8F5FA] border-b border-[#C5E8F5] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 text-[13px] text-[#1D1C1D]">
        <HeadphonesIcon />
        <span>
          Huddle active in <strong>{huddleLabel}</strong>
        </span>
      </div>
      <button
        type="button"
        onClick={endHuddle}
        className="text-[13px] font-bold text-[#1264A3] hover:underline"
      >
        Leave huddle
      </button>
    </div>
  );
}

function HeadphonesIcon() {
  return (
    <svg className="w-4 h-4 text-[#1264A3]" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v4a4 4 0 004 4h1v-2H6a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2h-1v2h1a4 4 0 004-4V7a2 2 0 00-2-2H4z" clipRule="evenodd" />
    </svg>
  );
}
