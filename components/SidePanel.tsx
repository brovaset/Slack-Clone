"use client";

import { useApp } from "@/lib/context/AppContext";
import { getAvatarColor } from "@/lib/utils";
import type { UserStatus } from "@/lib/types";

export default function SidePanel() {
  const {
    openPanel,
    setOpenPanel,
    members,
    channels,
    dms,
    drafts,
    deleteDraft,
    openChannel,
    openDm,
    searchQuery,
    setSearchQuery,
    messages,
    getChannel,
    activeChannelId,
    activity,
    setUserStatus,
    userStatus,
  } = useApp();

  if (!openPanel) return null;

  function close() {
    setOpenPanel(null);
  }

  const channel = activeChannelId ? getChannel(activeChannelId) : undefined;

  const searchResults = searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={close} />
      <aside className="fixed right-0 top-0 h-full w-[360px] bg-white border-l border-[#E8E8E8] z-50 flex flex-col shadow-xl">
        <header className="px-4 h-[49px] border-b border-[#E8E8E8] flex items-center justify-between shrink-0">
          <h2 className="font-bold text-[#1D1C1D] text-[15px]">
            {panelTitle(openPanel)}
          </h2>
          <button
            onClick={close}
            className="p-1 rounded hover:bg-[#F8F8F8] text-[#616061]"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {openPanel === "members" && (
            <ul className="py-2">
              {members.map((m) => (
                <li key={m.id}>
                  <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F8F8F8] text-left">
                    <span className="relative shrink-0">
                      <span
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: getAvatarColor(m.name) }}
                      >
                        {m.name.charAt(0)}
                      </span>
                      <StatusDot status={m.status} />
                    </span>
                    <div>
                      <p className="text-[15px] font-bold text-[#1D1C1D]">{m.name}</p>
                      <p className="text-[13px] text-[#616061]">{m.title}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {openPanel === "search" && (
            <div className="p-4">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full px-3 py-2 border border-[#868686] rounded focus:outline-none focus:border-[#1264A3] text-[15px] mb-4"
              />
              {searchQuery.trim() === "" ? (
                <p className="text-[13px] text-[#616061]">Type to search across messages</p>
              ) : searchResults.length === 0 ? (
                <p className="text-[13px] text-[#616061]">No results for &ldquo;{searchQuery}&rdquo;</p>
              ) : (
                <ul className="space-y-2">
                  {searchResults.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => {
                          openChannel(m.channel_id);
                          close();
                        }}
                        className="w-full text-left p-3 rounded hover:bg-[#F8F8F8] border border-[#E8E8E8]"
                      >
                        <p className="text-[13px] text-[#616061] mb-1">
                          #{getChannel(m.channel_id)?.name} · {m.profiles?.display_name}
                        </p>
                        <p className="text-[15px] text-[#1D1C1D]">{m.content}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {openPanel === "channel-info" && channel && (
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-[22px] font-bold text-[#1D1C1D] mb-1">#{channel.name}</h3>
                <p className="text-[15px] text-[#616061]">{channel.description}</p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#616061] uppercase mb-2">Created</p>
                <p className="text-[15px]">{new Date(channel.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#616061] uppercase mb-2">Members</p>
                <p className="text-[15px]">{members.length} members</p>
              </div>
            </div>
          )}

          {openPanel === "workspace" && (
            <div className="py-2">
              <button className="w-full px-4 py-2 text-left hover:bg-[#F8F8F8] font-bold text-[#1D1C1D]">
                Acme Corp
              </button>
              <button className="w-full px-4 py-2 text-left hover:bg-[#F8F8F8] text-[#616061]">
                + Add a workspace
              </button>
              <hr className="my-2 border-[#E8E8E8]" />
              <button className="w-full px-4 py-2 text-left hover:bg-[#F8F8F8] text-[#616061]">
                Preferences
              </button>
            </div>
          )}

          {openPanel === "quick-add" && (
            <div className="py-2">
              <button
                onClick={() => {
                  close();
                  document.dispatchEvent(new CustomEvent("slack:open-create-channel"));
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-[#F8F8F8] text-[15px]"
              >
                Create a new channel
              </button>
              <button
                onClick={() => {
                  openDm(dms[0]?.id ?? "");
                  close();
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-[#F8F8F8] text-[15px]"
              >
                New direct message
              </button>
              <button
                onClick={() => {
                  setOpenPanel("huddles");
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-[#F8F8F8] text-[15px]"
              >
                Start a huddle
              </button>
            </div>
          )}

          {openPanel === "threads" && (
            <div className="p-4 space-y-3">
              {messages.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    openChannel(m.channel_id);
                    close();
                  }}
                  className="w-full text-left p-3 rounded border border-[#E8E8E8] hover:bg-[#F8F8F8]"
                >
                  <p className="text-[13px] text-[#616061] mb-1">
                    Thread in #{getChannel(m.channel_id)?.name}
                  </p>
                  <p className="text-[15px] font-bold">{m.profiles?.display_name}</p>
                  <p className="text-[15px] text-[#1D1C1D] truncate">{m.content}</p>
                </button>
              ))}
            </div>
          )}

          {openPanel === "huddles" && (
            <div className="p-4">
              <p className="text-[15px] text-[#616061] mb-4">
                Start an audio or video huddle with your team.
              </p>
              <button
                onClick={close}
                className="w-full py-2.5 bg-[#007A5A] text-white font-bold rounded hover:bg-[#148567]"
              >
                Start Huddle in #{channel?.name ?? "general"}
              </button>
            </div>
          )}

          {openPanel === "drafts" && (
            <div className="py-2">
              {drafts.length === 0 ? (
                <p className="px-4 py-8 text-[#616061] text-[15px]">No drafts yet</p>
              ) : (
                drafts.map((d) => (
                  <div key={d.id} className="px-4 py-3 hover:bg-[#F8F8F8] border-b border-[#E8E8E8]">
                    <div className="flex justify-between items-start mb-1">
                      <button
                        onClick={() => {
                          if (d.targetType === "channel") {
                            const ch = channels.find((c) => c.name === d.target);
                            if (ch) openChannel(ch.id);
                          } else {
                            const dm = dms.find((x) => x.name === d.target);
                            if (dm) openDm(dm.id);
                          }
                          close();
                          document.dispatchEvent(
                            new CustomEvent("slack:load-draft", { detail: d.content })
                          );
                        }}
                        className="text-[13px] font-bold text-[#1264A3] hover:underline"
                      >
                        {d.targetType === "channel" ? "#" : ""}
                        {d.target}
                      </button>
                      <button
                        onClick={() => deleteDraft(d.id)}
                        className="text-[#616061] hover:text-[#E01E5A] text-xs"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-[15px] text-[#1D1C1D] truncate">{d.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {openPanel === "profile" && (
            <div className="p-4 space-y-3">
              <p className="text-[13px] font-bold text-[#616061] uppercase">Set a status</p>
              {(["active", "away", "dnd"] as UserStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setUserStatus(s);
                    close();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#F8F8F8] ${
                    userStatus === s ? "bg-[#E8F5FA]" : ""
                  }`}
                >
                  <StatusDot status={s} large />
                  <span className="text-[15px] capitalize">{s === "dnd" ? "Do not disturb" : s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function panelTitle(panel: string) {
  const titles: Record<string, string> = {
    members: "Members",
    search: "Search",
    "channel-info": "Channel details",
    workspace: "Workspaces",
    "quick-add": "Create",
    threads: "Threads",
    huddles: "Huddle",
    drafts: "Drafts & sent",
    profile: "Update your status",
  };
  return titles[panel] ?? panel;
}

function StatusDot({
  status,
  large,
}: {
  status: "active" | "away" | "dnd";
  large?: boolean;
}) {
  const colors = { active: "bg-[#2BAC76]", away: "bg-transparent border-[#ABABAD]", dnd: "bg-[#E01E5A]" };
  const size = large ? "w-3 h-3" : "w-2.5 h-2.5";
  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 ${size} rounded-full border-2 border-white ${colors[status]}`}
    />
  );
}
