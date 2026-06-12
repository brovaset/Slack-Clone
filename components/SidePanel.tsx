"use client";

import { WORKSPACE_NAME, WORKSPACE_URL } from "@/components/WorkspaceMenu";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/context/AppContext";
import { AppEvents, dispatchLoadDraft } from "@/lib/security/events";
import { LIMITS } from "@/lib/security";
import { showToast } from "@/lib/toast";
import { getAvatarColor, messageSenderName } from "@/lib/utils";
import { useMemo, useState } from "react";

export default function SidePanel() {
  const {
    openPanel,
    setOpenPanel,
    members,
    channelMembers,
    addMemberToChannel,
    removeMemberFromChannel,
    channels,
    dms,
    drafts,
    deleteDraft,
    openChannel,
    openDm,
    openDmWithMember,
    searchQuery,
    setSearchQuery,
    messages,
    getChannel,
    activeChannelId,
    activeDmId,
    startHuddle,
    notificationsPaused,
    setNotificationsPaused,
    customStatus,
    setCustomStatus,
    userStatus,
    setUserStatus,
  } = useApp();
  const { user } = useAuth();
  const [dmSearch, setDmSearch] = useState("");

  const dmCandidates = useMemo(() => {
    const others = members.filter((m) => !m.name.endsWith("(you)"));
    const q = dmSearch.trim().toLowerCase();
    if (!q) return others;
    return others.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q)
    );
  }, [members, dmSearch]);

  if (!openPanel) return null;

  function close() {
    setOpenPanel(null);
  }

  const channel = activeChannelId ? getChannel(activeChannelId) : undefined;
  const channelMemberIds = new Set(channelMembers.map((cm) => cm.user_id));
  const membersNotInChannel = members.filter(
    (m) => !channelMemberIds.has(m.id) && !m.name.endsWith("(you)")
  );

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
          {openPanel === "members" && activeChannelId && channel ? (
            <div className="py-2">
              <p className="px-4 py-2 text-[13px] font-bold text-[#616061] uppercase">
                In #{channel.name}
              </p>
              <ul>
                {channelMembers.map((cm) => (
                  <li key={cm.user_id} className="flex items-center gap-2 px-4 py-2 hover:bg-[#F8F8F8]">
                    <button
                      onClick={() => {
                        if (cm.user_id !== user?.id) {
                          openDmWithMember(cm.member);
                          close();
                        }
                      }}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      <span className="relative shrink-0">
                        <span
                          className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: getAvatarColor(cm.member.name) }}
                        >
                          {cm.member.name.charAt(0)}
                        </span>
                        <StatusDot status={cm.member.status} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-[#1D1C1D] truncate">{cm.member.name}</p>
                        <p className="text-[13px] text-[#616061] truncate">{cm.member.title}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => removeMemberFromChannel(activeChannelId, cm.user_id)}
                      className="text-[13px] text-[#E01E5A] hover:underline shrink-0"
                      title={cm.user_id === user?.id ? "Leave channel" : "Remove from channel"}
                    >
                      {cm.user_id === user?.id ? "Leave" : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
              {membersNotInChannel.length > 0 && (
                <>
                  <p className="px-4 py-3 text-[13px] font-bold text-[#616061] uppercase border-t border-[#E8E8E8] mt-2">
                    Add people
                  </p>
                  <ul>
                    {membersNotInChannel.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 px-4 py-2 hover:bg-[#F8F8F8]">
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                          <span
                            className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{ backgroundColor: getAvatarColor(m.name) }}
                          >
                            {m.name.charAt(0)}
                          </span>
                          <p className="text-[15px] font-bold text-[#1D1C1D] truncate">{m.name}</p>
                        </div>
                        <button
                          onClick={() => addMemberToChannel(activeChannelId, m.id)}
                          className="text-[13px] text-[#1264A3] font-bold hover:underline shrink-0"
                        >
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : openPanel === "members" ? (
            <ul className="py-2">
              {members
                .filter((m) => !m.name.endsWith("(you)"))
                .map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      openDmWithMember(m);
                      close();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F8F8F8] text-left"
                  >
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
          ) : null}

          {openPanel === "search" && (
            <div className="p-4">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                maxLength={LIMITS.searchQuery}
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
                          #{getChannel(m.channel_id)?.name} · {messageSenderName(m, members)}
                        </p>
                        <p className="text-[15px] text-[#1D1C1D]">{m.content}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {openPanel === "channel-info" && (
            <div className="p-4 space-y-4">
              {channel ? (
                <>
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
                    <button
                      onClick={() => setOpenPanel("members")}
                      className="text-[15px] text-[#1264A3] hover:underline"
                    >
                      {channelMembers.length} members
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[15px] text-[#616061]">Select a channel to view details.</p>
              )}
            </div>
          )}

          {openPanel === "quick-add" && (
            <div className="py-2">
              <button
                onClick={() => {
                  close();
                  document.dispatchEvent(new CustomEvent(AppEvents.openCreateChannel));
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-[#F8F8F8] text-[15px]"
              >
                Create a new channel
              </button>
              <button
                onClick={() => setOpenPanel("new-dm")}
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
            <div className="p-4">
              <p className="text-[15px] text-[#616061] py-8 text-center">
                No threads yet. Reply in a channel to start a thread.
              </p>
            </div>
          )}

          {openPanel === "huddles" && (
            <div className="p-4">
              <p className="text-[15px] text-[#616061] mb-4">
                Start an audio or video huddle with your team.
              </p>
              <button
                onClick={() => {
                  const dm = activeDmId ? dms.find((d) => d.id === activeDmId) : null;
                  const label = dm
                    ? dm.name
                    : channel
                      ? `#${channel.name}`
                      : "#general";
                  startHuddle(label);
                }}
                className="w-full py-2.5 bg-[#007A5A] text-white font-bold rounded hover:bg-[#148567]"
              >
                Start Huddle in {activeDmId
                  ? dms.find((d) => d.id === activeDmId)?.name ?? "DM"
                  : `#${channel?.name ?? "general"}`}
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
                          dispatchLoadDraft(d.content);
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

          {openPanel === "new-dm" && (
            <div className="py-2">
              <div className="px-4 pb-3">
                <input
                  type="search"
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  placeholder="Search teammates..."
                  className="w-full px-3 py-2 border border-[#868686] rounded text-[15px] focus:outline-none focus:border-[#1264A3] focus:shadow-[0_0_0_1px_#1264A3]"
                  autoFocus
                />
              </div>
              {dmCandidates.length === 0 ? (
                <p className="px-4 py-6 text-[15px] text-[#616061] text-center leading-relaxed">
                  {members.length <= 1
                    ? "No other teammates yet. Ask classmates to sign up at this app, then they will appear here."
                    : "No teammates match your search."}
                </p>
              ) : (
                <ul>
                  {dmCandidates.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          openDmWithMember(m);
                          setDmSearch("");
                          close();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F8F8F8] text-left"
                      >
                        <span
                          className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: getAvatarColor(m.name) }}
                        >
                          {m.name.charAt(0)}
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
            </div>
          )}

          {openPanel === "profile" && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: getAvatarColor(user?.displayName ?? "User") }}
                >
                  {(user?.displayName ?? "U").charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-[18px] font-bold text-[#1D1C1D]">{user?.displayName}</p>
                  <p className="text-[13px] text-[#616061]">{user?.email}</p>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#616061] uppercase mb-2">Status</p>
                <input
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="Set a status"
                  className="w-full px-3 py-2 border border-[#868686] rounded text-[15px] focus:outline-none focus:border-[#1264A3]"
                />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#616061] uppercase mb-2">Presence</p>
                <div className="flex gap-2">
                  {(["active", "away"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setUserStatus(s)}
                      className={`px-3 py-1.5 rounded text-[13px] font-bold capitalize ${
                        userStatus === s
                          ? "bg-[#1264A3] text-white"
                          : "bg-[#F8F8F8] text-[#616061] hover:bg-[#E8E8E8]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {openPanel === "preferences" && (
            <div className="p-4 space-y-4">
              <PreferenceRow
                label="Pause notifications"
                checked={notificationsPaused}
                onChange={(v) => {
                  setNotificationsPaused(v);
                  showToast(v ? "Notifications paused" : "Notifications resumed");
                }}
              />
            </div>
          )}

          {openPanel === "downloads" && (
            <div className="p-4">
              <p className="text-[15px] text-[#616061] mb-4">
                Files you download from Slack will appear here.
              </p>
              <p className="text-[13px] text-[#ABABAD]">No downloads yet</p>
            </div>
          )}

          {openPanel === "workspace" && (
            <div className="py-2">
              <button
                onClick={close}
                className="w-full px-4 py-3 text-left hover:bg-[#F8F8F8]"
              >
                <p className="text-[15px] font-bold text-[#1D1C1D]">{WORKSPACE_NAME}</p>
                <p className="text-[13px] text-[#616061]">{WORKSPACE_URL}</p>
              </button>
              <button
                onClick={() => setOpenPanel("workspace-settings")}
                className="w-full px-4 py-2.5 text-left hover:bg-[#F8F8F8] text-[15px] text-[#1D1C1D]"
              >
                Workspace settings
              </button>
            </div>
          )}

          {openPanel === "workspace-settings" && (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[13px] font-bold text-[#616061] uppercase mb-2">Workspace name</p>
                <p className="text-[15px] text-[#1D1C1D]">{WORKSPACE_NAME}</p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#616061] uppercase mb-2">URL</p>
                <p className="text-[15px] text-[#1D1C1D]">{WORKSPACE_URL}</p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#616061] uppercase mb-2">Members</p>
                <button
                  onClick={() => setOpenPanel("members")}
                  className="text-[15px] text-[#1264A3] hover:underline"
                >
                  {members.length} members
                </button>
              </div>
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
    "workspace-settings": "Workspace settings",
    "new-dm": "New message",
    profile: "Profile",
    preferences: "Preferences",
    downloads: "Downloads",
    "quick-add": "Create",
    threads: "Threads",
    huddles: "Huddle",
    drafts: "Drafts & sent",
  };
  return titles[panel] ?? panel;
}

function PreferenceRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[15px] text-[#1D1C1D]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${
          checked ? "bg-[#007A5A]" : "bg-[#ABABAD]"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "left-5" : "left-1"
          }`}
        />
      </button>
    </label>
  );
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
