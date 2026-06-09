"use client";

import {
  MOCK_ACTIVITY,
  MOCK_CHANNELS,
  MOCK_DM_MESSAGES,
  MOCK_DMS,
  MOCK_DRAFTS,
  MOCK_MEMBERS,
  MOCK_MESSAGES,
} from "@/lib/mock-data";
import type {
  Channel,
  DirectMessage,
  Draft,
  DmMessage,
  Message,
  PanelType,
  RailView,
  UserStatus,
} from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AppContextValue {
  channels: Channel[];
  messages: Message[];
  dms: DirectMessage[];
  dmMessages: DmMessage[];
  drafts: Draft[];
  railView: RailView;
  activeChannelId: string | null;
  activeDmId: string | null;
  openPanel: PanelType;
  searchQuery: string;
  userStatus: UserStatus;
  isRecording: boolean;
  setRailView: (view: RailView) => void;
  setActiveChannelId: (id: string | null) => void;
  setActiveDmId: (id: string | null) => void;
  setOpenPanel: (panel: PanelType) => void;
  setSearchQuery: (q: string) => void;
  setUserStatus: (status: UserStatus) => void;
  setIsRecording: (v: boolean) => void;
  addChannel: (name: string, description?: string) => Channel | null;
  addMessage: (channelId: string, userId: string, displayName: string, content: string) => void;
  addDmMessage: (dmId: string, userId: string, displayName: string, content: string) => void;
  saveDraft: (content: string, target: string, targetType: "channel" | "dm") => void;
  deleteDraft: (id: string) => void;
  getChannelMessages: (channelId: string) => Message[];
  getDmMessages: (dmId: string) => DmMessage[];
  getChannel: (channelId: string) => Channel | undefined;
  getDm: (dmId: string) => DirectMessage | undefined;
  openChannel: (channelId: string) => void;
  openDm: (dmId: string) => void;
  activity: typeof MOCK_ACTIVITY;
  members: typeof MOCK_MEMBERS;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [dms] = useState<DirectMessage[]>(MOCK_DMS);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>(MOCK_DM_MESSAGES);
  const [drafts, setDrafts] = useState<Draft[]>(MOCK_DRAFTS);
  const [railView, setRailView] = useState<RailView>("home");
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    MOCK_CHANNELS[0]?.id ?? null
  );
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userStatus, setUserStatus] = useState<UserStatus>("active");
  const [isRecording, setIsRecording] = useState(false);

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

  const addChannel = useCallback((name: string, description?: string) => {
    const normalized = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized) return null;

    const created: Channel = {
      id: `ch-${Date.now()}`,
      name: normalized,
      description: description?.trim() || null,
      created_at: new Date().toISOString(),
    };

    setChannels((prev) => {
      if (prev.some((c) => c.name === normalized)) return prev;
      return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
    });

    return created;
  }, []);

  const addMessage = useCallback(
    (channelId: string, userId: string, displayName: string, content: string) => {
      const message: Message = {
        id: `msg-${Date.now()}`,
        channel_id: channelId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
        profiles: { id: userId, display_name: displayName, created_at: "" },
      };
      setMessages((prev) => [...prev, message]);
    },
    []
  );

  const addDmMessage = useCallback(
    (dmId: string, userId: string, displayName: string, content: string) => {
      const message: DmMessage = {
        id: `dm-msg-${Date.now()}`,
        dm_id: dmId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
        profiles: { id: userId, display_name: displayName, created_at: "" },
      };
      setDmMessages((prev) => [...prev, message]);
    },
    []
  );

  const saveDraft = useCallback(
    (content: string, target: string, targetType: "channel" | "dm") => {
      if (!content.trim()) return;
      setDrafts((prev) => {
        const existing = prev.find(
          (d) => d.target === target && d.targetType === targetType
        );
        if (existing) {
          return prev.map((d) =>
            d.id === existing.id
              ? { ...d, content, updated_at: new Date().toISOString() }
              : d
          );
        }
        return [
          {
            id: `draft-${Date.now()}`,
            target,
            targetType,
            content,
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    },
    []
  );

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

  return (
    <AppContext.Provider
      value={{
        channels,
        messages,
        dms,
        dmMessages,
        drafts,
        railView,
        activeChannelId,
        activeDmId,
        openPanel,
        searchQuery,
        userStatus,
        isRecording,
        setRailView,
        setActiveChannelId,
        setActiveDmId,
        setOpenPanel,
        setSearchQuery,
        setUserStatus,
        setIsRecording,
        addChannel,
        addMessage,
        addDmMessage,
        saveDraft,
        deleteDraft,
        getChannelMessages,
        getDmMessages,
        getChannel,
        getDm,
        openChannel,
        openDm,
        activity: MOCK_ACTIVITY,
        members: MOCK_MEMBERS,
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
