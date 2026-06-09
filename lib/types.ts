export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface DirectMessage {
  id: string;
  name: string;
  status: "active" | "away";
  user_id: string;
}

export interface DmMessage {
  id: string;
  dm_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Member {
  id: string;
  name: string;
  title: string;
  status: "active" | "away" | "dnd";
}

export interface Draft {
  id: string;
  target: string;
  targetType: "channel" | "dm";
  content: string;
  updated_at: string;
}

export interface ActivityItem {
  id: string;
  type: "mention" | "reaction" | "reply";
  from: string;
  message: string;
  channel: string;
  created_at: string;
}

export type RailView = "home" | "dms" | "activity" | "files" | "more";

export type PanelType =
  | "members"
  | "search"
  | "channel-info"
  | "workspace"
  | "workspace-settings"
  | "quick-add"
  | "new-dm"
  | "emoji"
  | "threads"
  | "huddles"
  | "drafts"
  | "profile"
  | "preferences"
  | "downloads"
  | null;

export type UserStatus = "active" | "away" | "dnd";
