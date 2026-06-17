"use client";

import { useApp } from "@/lib/context/AppContext";

export default function ThreadsView() {
  const { openChannel, channels } = useApp();

  return (
    <div className="flex-1 flex flex-col bg-white h-screen min-w-0">
      <header className="px-5 h-[49px] border-b border-[#E8E8E8] flex items-center shrink-0">
        <h2 className="font-bold text-[#1D1C1D] text-[18px]">Threads</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-xl">
        <h3 className="text-[22px] font-bold text-[#1D1C1D] mb-2">Stay on top of side conversations</h3>
        <p className="text-[15px] text-[#616061] leading-relaxed mb-6">
          Threaded replies are not part of this MVP yet. For now, keep discussions in channels
          and use direct messages for private follow-ups.
        </p>
        <p className="text-[13px] font-bold text-[#616061] uppercase tracking-wide mb-3">
          Jump to a channel
        </p>
        <ul className="space-y-1">
          {channels.map((ch) => (
            <li key={ch.id}>
              <button
                type="button"
                onClick={() => openChannel(ch.id)}
                className="w-full text-left px-3 py-2 rounded-md text-[15px] text-[#1D1C1D] hover:bg-[#F8F8F8] font-medium"
              >
                # {ch.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
