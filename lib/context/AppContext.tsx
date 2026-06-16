"use client";

import { useAuth } from "@/lib/auth";
import {
  addChannelMember,
  createChannel,
  ensureUserProfile,
  fetchChannelMembers,
  fetchChannelMessages,
  fetchDmMessages,
  fetchProfiles,
  fetchUserChannels,
  fetchUserDms,
  getOrCreateDm,
  profilesToMembers,
  removeChannelMember,
  sendChannelMessage,
  sendDmMessage,
  updateProfile,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/errors";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { showToast } from "@/lib/toast";
import { uploadChatFile } from "@/lib/uploads";
import {
  RATE_LIMITS,
  checkRateLimit,
  formatRetryAfter,
  sanitizeChannelDescription,
  sanitizeChannelName,
  sanitizeDraftContent,
  sanitizeMessage,
  sanitizeSearchQuery,
  sanitizeStatus,
} from "@/lib/security";
import type {
  Channel,
  ChannelMember,
  DirectMessage,
  Draft,
  DmMessage,
  Member,
  Message,
  PanelType,
  RailView,
  UserStatus,
} from "@/lib/types";
import {
  type ChannelUnreadInfo,
  useChannelTrack,
} from "@/hooks/useChannelTrack";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface AppContextValue {
  loading: boolean;
  channels: Channel[];
  messages: Message[];
  dms: DirectMessage[];
  dmMessages: DmMessage[];
  drafts: Draft[];
  members: Member[];
  channelMembers: ChannelMember[];
  railView: RailView;
  activeChannelId: string | null;
  activeDmId: string | null;
  openPanel: PanelType;
  searchQuery: string;
  userStatus: UserStatus;
  notificationsPaused: boolean;
  profileMenuOpen: boolean;
  workspaceMenuOpen: boolean;
  customStatus: string;
  huddleActive: boolean;
  huddleLabel: string | null;
  setRailView: (view: RailView) => void;
  setActiveChannelId: (id: string | null) => void;
  setActiveDmId: (id: string | null) => void;
  setOpenPanel: (panel: PanelType) => void;
  setSearchQuery: (q: string) => void;
  setUserStatus: (status: UserStatus) => void;
  setNotificationsPaused: (v: boolean) => void;
  setProfileMenuOpen: (open: boolean) => void;
  setWorkspaceMenuOpen: (open: boolean) => void;
  setCustomStatus: (status: string) => void;
  startHuddle: (label: string) => void;
  endHuddle: () => void;
  openDmWithMember: (member: Member) => Promise<void>;
  addChannel: (name: string, description?: string) => Promise<Channel | null>;
  addMessage: (
    channelId: string,
    userId: string,
    displayName: string,
    content: string,
    file?: File
  ) => Promise<void>;
  addDmMessage: (
    dmId: string,
    userId: string,
    displayName: string,
    content: string,
    file?: File
  ) => Promise<void>;
  addMemberToChannel: (channelId: string, userId: string) => Promise<void>;
  removeMemberFromChannel: (channelId: string, userId: string) => Promise<void>;
  refreshChannelMembers: (channelId: string) => Promise<void>;
  saveDraft: (content: string, target: string, targetType: "channel" | "dm") => void;
  deleteDraft: (id: string) => void;
  getChannelMessages: (channelId: string) => Message[];
  getDmMessages: (dmId: string) => DmMessage[];
  getChannel: (channelId: string) => Channel | undefined;
  getDm: (dmId: string) => DirectMessage | undefined;
  openChannel: (channelId: string) => void;
  openDm: (dmId: string) => void;
  getChannelUnreadInfo: (channelId: string) => ChannelUnreadInfo;
  getChannelLastViewedAt: (channelId: string) => string | null;
  channelUnreadMap: Record<string, ChannelUnreadInfo>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dms, setDms] = useState<DirectMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [railView, setRailView] = useState<RailView>("home");
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userStatus, setUserStatusState] = useState<UserStatus>("active");
  const [notificationsPaused, setNotificationsPaused] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [customStatus, setCustomStatusState] = useState("");
  const [huddleActive, setHuddleActive] = useState(false);
  const [huddleLabel, setHuddleLabel] = useState<string | null>(null);

  const {
    getChannelUnreadInfo,
    getLastViewedAt: getChannelLastViewedAt,
    channelUnreadMap,
  } = useChannelTrack(user?.id, messages, activeChannelId);

  const loadChannelMembers = useCallback(async (channelId: string) => {
    try {
      const data = await fetchChannelMembers(channelId);
      setChannelMembers(data);
    } catch {
      setChannelMembers([]);
    }
  }, []);

  const reloadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await ensureUserProfile();
      const profiles = await fetchProfiles();
      setMembers(profilesToMembers(profiles, user.id));

      const myProfile = profiles.find((p) => p.id === user.id);
      if (myProfile) {
        setCustomStatusState(myProfile.custom_status ?? "");
        setUserStatusState(myProfile.user_status ?? "active");
      }

      const userChannels = await fetchUserChannels(user.id);
      setChannels(userChannels);
      if (!activeChannelId && userChannels.length > 0) {
        setActiveChannelId(userChannels[0].id);
      }

      const channelIds = userChannels.map((c) => c.id);
      const channelMsgs = await fetchChannelMessages(channelIds);
      setMessages(channelMsgs);

      const userDms = await fetchUserDms(user.id, profiles);
      setDms(userDms);

      const dmIds = userDms.map((d) => d.id);
      const dmMsgs = await fetchDmMessages(dmIds);
      setDmMessages(dmMsgs);

      if (activeChannelId) {
        await loadChannelMembers(activeChannelId);
      }
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, [user, activeChannelId, loadChannelMembers]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    reloadData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || !activeChannelId) {
      setChannelMembers([]);
      return;
    }
    loadChannelMembers(activeChannelId);
  }, [activeChannelId, user, loadChannelMembers]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("app-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const raw = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === raw.id)) return prev;
            const member = members.find((m) => m.id === raw.user_id);
            const senderName = member?.name.replace(/ \(you\)$/, "").trim();
            const msg: Message = {
              ...raw,
              attachment_url: raw.attachment_url ?? null,
              attachment_name: raw.attachment_name ?? null,
              attachment_type: raw.attachment_type ?? null,
              profiles:
                raw.profiles?.display_name?.trim()
                  ? raw.profiles
                  : senderName
                    ? {
                        id: member!.id,
                        display_name: senderName,
                        created_at: "",
                        user_status: member!.status,
                      }
                    : undefined,
            };
            return [...prev, msg];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages" },
        (payload: RealtimePostgresChangesPayload<{
          id: string;
          conversation_id: string;
          user_id: string;
          content: string;
          created_at: string;
        }>) => {
          const raw = payload.new as {
            id: string;
            conversation_id: string;
            user_id: string;
            content: string;
            created_at: string;
            attachment_url?: string | null;
            attachment_name?: string | null;
            attachment_type?: string | null;
          };
          const member = members.find((m) => m.id === raw.user_id);
          const senderName = member?.name.replace(/ \(you\)$/, "").trim();
          const msg: DmMessage = {
            id: raw.id,
            dm_id: raw.conversation_id,
            user_id: raw.user_id,
            content: raw.content,
            created_at: raw.created_at,
            attachment_url: raw.attachment_url ?? null,
            attachment_name: raw.attachment_name ?? null,
            attachment_type: raw.attachment_type ?? null,
            profiles: senderName
              ? {
                  id: member!.id,
                  display_name: senderName,
                  created_at: "",
                  user_status: member!.status,
                }
              : undefined,
          };
          setDmMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "channel_members" },
        () => {
          if (activeChannelId) loadChannelMembers(activeChannelId);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "channel_members" },
        (payload: RealtimePostgresChangesPayload<{ channel_id: string; user_id: string }>) => {
          const removed = payload.old as { channel_id: string; user_id: string };
          if (removed.user_id === user.id) {
            setChannels((prev) => prev.filter((c) => c.id !== removed.channel_id));
            if (activeChannelId === removed.channel_id) {
              setActiveChannelId(null);
            }
          }
          if (activeChannelId) loadChannelMembers(activeChannelId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChannelId, loadChannelMembers, members]);

  const openChannel = useCallback((channelId: string) => {
    setRailView("home");
    setActiveDmId(null);
    setActiveChannelId(channelId);
    setOpenPanel(null);
  }, []);

  const openDm = useCallback((dmId: string) => {
    setRailView("dms");
    setActiveChannelId(null);
    setActiveDmId(dmId);
    setOpenPanel(null);
  }, []);

  const addChannel = useCallback(
    async (name: string, description?: string) => {
      if (!user) return null;

      const rate = checkRateLimit(
        "channel:create",
        RATE_LIMITS.channel.max,
        RATE_LIMITS.channel.windowMs
      );
      if (!rate.allowed) {
        showToast(`Slow down — try again in ${formatRetryAfter(rate.retryAfterMs)}`);
        return null;
      }

      const normalized = sanitizeChannelName(name);
      if (!normalized) {
        showToast("Use letters, numbers, hyphens, or underscores for channel names.");
        return null;
      }

      try {
        const created = await createChannel(
          normalized,
          description ? sanitizeChannelDescription(description) : null,
          user.id
        );
        setChannels((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        return created;
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to create channel");
        if (msg.includes("duplicate") || msg.includes("unique")) {
          showToast("A channel with that name already exists.");
        } else {
          showToast(msg);
        }
        return null;
      }
    },
    [user]
  );

  const addMessage = useCallback(
    async (
      channelId: string,
      userId: string,
      displayName: string,
      content: string,
      file?: File
    ) => {
      const rate = checkRateLimit(
        `message:${channelId}`,
        RATE_LIMITS.message.max,
        RATE_LIMITS.message.windowMs
      );
      if (!rate.allowed) {
        showToast(`Message limit reached. Wait ${formatRetryAfter(rate.retryAfterMs)}.`);
        return;
      }

      const trimmed = content.trim();
      if (!trimmed && !file) return;

      const safeContent = trimmed ? sanitizeMessage(trimmed) : "";
      if (trimmed && !safeContent) return;

      try {
        const attachment = file ? await uploadChatFile(file, userId) : undefined;
        const message = await sendChannelMessage(
          channelId,
          userId,
          safeContent ?? "",
          attachment
        );
        const withSender: Message = {
          ...message,
          profiles: {
            id: userId,
            display_name: displayName,
            created_at: message.created_at,
            user_status: "active",
          },
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, withSender];
        });
      } catch (err) {
        showToast(getErrorMessage(err, "Failed to send message"));
      }
    },
    []
  );

  const addDmMessage = useCallback(
    async (
      dmId: string,
      userId: string,
      displayName: string,
      content: string,
      file?: File
    ) => {
      const rate = checkRateLimit(
        `dm-message:${dmId}`,
        RATE_LIMITS.message.max,
        RATE_LIMITS.message.windowMs
      );
      if (!rate.allowed) {
        showToast(`Message limit reached. Wait ${formatRetryAfter(rate.retryAfterMs)}.`);
        return;
      }

      const trimmed = content.trim();
      if (!trimmed && !file) return;

      const safeContent = trimmed ? sanitizeMessage(trimmed) : "";
      if (trimmed && !safeContent) return;

      try {
        const attachment = file ? await uploadChatFile(file, userId) : undefined;
        const message = await sendDmMessage(dmId, userId, safeContent ?? "", attachment);
        const withSender: DmMessage = {
          ...message,
          profiles: {
            id: userId,
            display_name: displayName,
            created_at: message.created_at,
            user_status: "active",
          },
        };
        setDmMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, withSender];
        });
      } catch (err) {
        showToast(getErrorMessage(err, "Failed to send message"));
      }
    },
    []
  );

  const openDmWithMember = useCallback(
    async (member: Member) => {
      if (!user) return;
      const otherId = member.id;
      const cleanName = member.name.replace(/ \(you\)$/, "");

      const existing = dms.find((d) => d.user_id === otherId);
      if (existing) {
        openDm(existing.id);
        return;
      }

      try {
        const convId = await getOrCreateDm(user.id, otherId);
        const newDm: DirectMessage = {
          id: convId,
          name: cleanName,
          status: member.status === "dnd" ? "away" : member.status === "away" ? "away" : "active",
          user_id: otherId,
        };
        setDms((prev) => [...prev, newDm].sort((a, b) => a.name.localeCompare(b.name)));
        openDm(convId);
        showToast(`Started a DM with ${cleanName}`);
      } catch (err) {
        showToast(getErrorMessage(err, "Failed to open DM"));
      }
    },
    [user, dms, openDm]
  );

  const addMemberToChannel = useCallback(
    async (channelId: string, userId: string) => {
      try {
        await addChannelMember(channelId, userId);
        await loadChannelMembers(channelId);
        const added = members.find((m) => m.id === userId);
        showToast(`Added ${added?.name.replace(/ \(you\)$/, "") ?? "member"} to channel`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to add member");
      }
    },
    [loadChannelMembers, members]
  );

  const removeMemberFromChannel = useCallback(
    async (channelId: string, userId: string) => {
      try {
        await removeChannelMember(channelId, userId);
        if (userId === user?.id) {
          setChannels((prev) => prev.filter((c) => c.id !== channelId));
          if (activeChannelId === channelId) setActiveChannelId(null);
          showToast("You left the channel");
        } else {
          await loadChannelMembers(channelId);
          const removed = members.find((m) => m.id === userId);
          showToast(`Removed ${removed?.name.replace(/ \(you\)$/, "") ?? "member"}`);
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to remove member");
      }
    },
    [user, activeChannelId, loadChannelMembers, members]
  );

  const setUserStatus = useCallback(
    (status: UserStatus) => {
      setUserStatusState(status);
      if (user) {
        updateProfile(user.id, { user_status: status }).catch(() => {});
      }
    },
    [user]
  );

  const setCustomStatus = useCallback(
    (status: string) => {
      const safe = sanitizeStatus(status);
      setCustomStatusState(safe);
      if (user) {
        updateProfile(user.id, { custom_status: safe }).catch(() => {});
      }
    },
    [user]
  );

  const saveDraft = useCallback(
    (content: string, target: string, targetType: "channel" | "dm") => {
      const safeContent = sanitizeDraftContent(content);
      if (!safeContent) return;
      setDrafts((prev) => {
        const existing = prev.find(
          (d) => d.target === target && d.targetType === targetType
        );
        if (existing) {
          return prev.map((d) =>
            d.id === existing.id
              ? { ...d, content: safeContent, updated_at: new Date().toISOString() }
              : d
          );
        }
        return [
          {
            id: `draft-${Date.now()}`,
            target,
            targetType,
            content: safeContent,
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    },
    []
  );

  const setSearchQuerySafe = useCallback((q: string) => {
    setSearchQuery(sanitizeSearchQuery(q));
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getChannelMessages = useCallback(
    (channelId: string) =>
      messages
        .filter((m) => m.channel_id === channelId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [messages]
  );

  const getDmMessages = useCallback(
    (dmId: string) =>
      dmMessages
        .filter((m) => m.dm_id === dmId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [dmMessages]
  );

  const getChannel = useCallback(
    (channelId: string) => channels.find((c) => c.id === channelId),
    [channels]
  );

  const getDm = useCallback(
    (dmId: string) => dms.find((d) => d.id === dmId),
    [dms]
  );

  const startHuddle = useCallback((label: string) => {
    setHuddleActive(true);
    setHuddleLabel(label);
    setOpenPanel(null);
    showToast(`Huddle started in ${label}`);
  }, []);

  const endHuddle = useCallback(() => {
    setHuddleActive(false);
    setHuddleLabel(null);
    showToast("Huddle ended");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1d21] text-white">
        Loading workspace...
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        loading,
        channels,
        messages,
        dms,
        dmMessages,
        drafts,
        members,
        channelMembers,
        railView,
        activeChannelId,
        activeDmId,
        openPanel,
        searchQuery,
        userStatus,
        notificationsPaused,
        profileMenuOpen,
        workspaceMenuOpen,
        customStatus,
        huddleActive,
        huddleLabel,
        setRailView,
        setActiveChannelId,
        setActiveDmId,
        setOpenPanel,
        setSearchQuery: setSearchQuerySafe,
        setUserStatus,
        setNotificationsPaused,
        setProfileMenuOpen,
        setWorkspaceMenuOpen,
        setCustomStatus,
        startHuddle,
        endHuddle,
        openDmWithMember,
        addChannel,
        addMessage,
        addDmMessage,
        addMemberToChannel,
        removeMemberFromChannel,
        refreshChannelMembers: loadChannelMembers,
        saveDraft,
        deleteDraft,
        getChannelMessages,
        getDmMessages,
        getChannel,
        getDm,
        openChannel,
        openDm,
        getChannelUnreadInfo,
        getChannelLastViewedAt,
        channelUnreadMap,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
