"use client";

import { useApp } from "@/lib/context/AppContext";
import { getAvatarColor } from "@/lib/utils";

export default function HuddlesView() {
  const {
    channels,
    dms,
    activeChannelId,
    activeDmId,
    getChannel,
    getDm,
    openChannel,
    openDm,
    startHuddle,
  } = useApp();

  const channel = activeChannelId ? getChannel(activeChannelId) : undefined;
  const dm = activeDmId ? getDm(activeDmId) : undefined;
  const quickLabel = dm?.name ?? (channel ? `#${channel.name}` : null);

  return (
    <div className="flex-1 flex flex-col bg-white h-screen min-w-0">
      <header className="px-5 h-[49px] border-b border-[#E8E8E8] flex items-center shrink-0">
        <h2 className="font-bold text-[#1D1C1D] text-[18px]">Huddles</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {quickLabel && (
          <div className="mb-8 p-4 rounded-lg border border-[#E8E8E8] bg-[#F8F8F8] max-w-md">
            <p className="text-[15px] text-[#616061] mb-3">
              Start a lightweight audio huddle in your current conversation.
            </p>
            <button
              type="button"
              onClick={() => startHuddle(quickLabel)}
              className="px-4 py-2 bg-[#007A5A] text-white font-bold rounded-md hover:bg-[#148567] text-[15px]"
            >
              Start huddle in {quickLabel}
            </button>
          </div>
        )}

        <section className="mb-8">
          <h3 className="text-[13px] font-bold text-[#616061] uppercase tracking-wide mb-3">
            Channels
          </h3>
          <ul className="space-y-1 max-w-md">
            {channels.map((ch) => (
              <li key={ch.id}>
                <button
                  type="button"
                  onClick={() => {
                    openChannel(ch.id);
                    startHuddle(`#${ch.name}`);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#F8F8F8] text-left"
                >
                  <span className="text-[15px] font-medium text-[#1D1C1D]"># {ch.name}</span>
                  <span className="text-[13px] text-[#1264A3] font-bold">Start</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-[13px] font-bold text-[#616061] uppercase tracking-wide mb-3">
            Direct messages
          </h3>
          {dms.length === 0 ? (
            <p className="text-[15px] text-[#616061]">No direct messages yet.</p>
          ) : (
            <ul className="space-y-1 max-w-md">
              {dms.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      openDm(item.id);
                      startHuddle(item.name);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#F8F8F8] text-left"
                  >
                    <span
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: getAvatarColor(item.name) }}
                    >
                      {item.name.charAt(0)}
                    </span>
                    <span className="flex-1 text-[15px] font-medium text-[#1D1C1D] truncate">
                      {item.name}
                    </span>
                    <span className="text-[13px] text-[#1264A3] font-bold shrink-0">Start</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
