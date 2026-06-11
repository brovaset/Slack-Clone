"use client";

import { useApp } from "@/lib/context/AppContext";
import { AppEvents } from "@/lib/security/events";

const SHORTCUTS = [
  {
    id: "channel",
    name: "Create a channel",
    desc: "Start a new channel for your team",
    action: "channel" as const,
  },
  {
    id: "dm",
    name: "New message",
    desc: "Send a direct message to a teammate",
    action: "dm" as const,
  },
  {
    id: "status",
    name: "Set status",
    desc: "Update your profile status",
    action: "status" as const,
  },
];

export default function MoreView() {
  const { setOpenPanel, setProfileMenuOpen } = useApp();

  function runShortcut(action: (typeof SHORTCUTS)[number]["action"]) {
    if (action === "channel") {
      document.dispatchEvent(new CustomEvent(AppEvents.openCreateChannel));
      return;
    }
    if (action === "dm") {
      setOpenPanel("new-dm");
      return;
    }
    setProfileMenuOpen(true);
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-screen min-w-0">
      <header className="px-6 h-[49px] border-b border-[#E8E8E8] flex items-center shrink-0">
        <h2 className="font-bold text-[#1D1C1D] text-[18px]">More</h2>
      </header>

      <div className="flex-1 overflow-y-auto slack-scrollbar-light">
        <section className="px-6 py-5 border-b border-[#E8E8E8]">
          <h3 className="text-[13px] font-bold text-[#616061] uppercase tracking-wide mb-3">
            Shortcuts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SHORTCUTS.map((shortcut) => (
              <button
                key={shortcut.id}
                onClick={() => runShortcut(shortcut.action)}
                className="flex items-start gap-3 p-3 rounded-lg border border-[#E8E8E8] hover:border-[#CFCFCF] hover:shadow-sm hover:bg-[#FAFAFA] text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F4ECF6] flex items-center justify-center shrink-0 group-hover:bg-[#E8D4ED] transition-colors">
                  <ShortcutIcon />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[14px] text-[#1D1C1D]">{shortcut.name}</p>
                  <p className="text-[12px] text-[#616061] leading-snug mt-0.5">{shortcut.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="px-6 py-5">
          <h3 className="text-[13px] font-bold text-[#616061] uppercase tracking-wide mb-1">
            Apps
          </h3>
          <p className="text-[15px] text-[#616061] py-8 text-center">
            No apps are connected to this workspace yet.
          </p>
        </section>
      </div>
    </div>
  );
}

function ShortcutIcon() {
  return (
    <svg className="w-5 h-5 text-[#611F69]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  );
}
