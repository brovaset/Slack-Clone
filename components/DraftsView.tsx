"use client";

import { useApp } from "@/lib/context/AppContext";
import { dispatchLoadDraft } from "@/lib/security/events";

export default function DraftsView() {
  const {
    drafts,
    deleteDraft,
    channels,
    dms,
    openChannel,
    openDm,
  } = useApp();

  return (
    <div className="flex-1 flex flex-col bg-white h-screen min-w-0">
      <header className="px-5 h-[49px] border-b border-[#E8E8E8] flex items-center shrink-0">
        <h2 className="font-bold text-[#1D1C1D] text-[18px]">Drafts &amp; sent</h2>
      </header>
      <div className="flex-1 overflow-y-auto">
        {drafts.length === 0 ? (
          <div className="px-6 py-12 max-w-lg">
            <p className="text-[15px] text-[#616061] leading-relaxed">
              Drafts you start in any channel or DM appear here. Unsent text is saved automatically
              when you switch conversations.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E8E8E8]">
            {drafts.map((d) => (
              <li key={d.id} className="px-6 py-4 hover:bg-[#F8F8F8]">
                <div className="flex justify-between items-start gap-3 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (d.targetType === "channel") {
                        const ch = channels.find((c) => c.name === d.target);
                        if (ch) {
                          openChannel(ch.id);
                          dispatchLoadDraft(d.content);
                        }
                      } else {
                        const dm = dms.find((x) => x.name === d.target);
                        if (dm) {
                          openDm(dm.id);
                          dispatchLoadDraft(d.content);
                        }
                      }
                    }}
                    className="text-[13px] font-bold text-[#1264A3] hover:underline"
                  >
                    {d.targetType === "channel" ? "#" : ""}
                    {d.target}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDraft(d.id)}
                    className="text-[#616061] hover:text-[#E01E5A] text-xs shrink-0"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-[15px] text-[#1D1C1D] whitespace-pre-wrap break-words">
                  {d.content}
                </p>
                <p className="text-[12px] text-[#616061] mt-1">
                  {new Date(d.updated_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
