import { requireClient } from "@/lib/supabase/client";
import type { UploadedAttachment } from "@/lib/uploads";
import type {
  Channel,
  ChannelMember,
  DirectMessage,
  DmMessage,
  Member,
  Message,
  Profile,
} from "@/lib/types";

type AttachmentRow = {
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
};

function mapAttachmentFields(row: AttachmentRow) {
  return {
    attachment_url: row.attachment_url ?? null,
    attachment_name: row.attachment_name ?? null,
    attachment_type: row.attachment_type ?? null,
  };
}

function toMember(profile: Profile): Member {
  return {
    id: profile.id,
    name: profile.display_name,
    title: profile.custom_status || "Member",
    status: profile.user_status,
  };
}

export async function ensureUserProfile(): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.rpc("ensure_user_profile");
  if (error) throw error;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("list_workspace_profiles");
  if (error) throw error;
  return (data ?? []).map((p: {
    id: string;
    display_name: string;
    custom_status: string | null;
    user_status: string | null;
    created_at: string;
  }) => ({
    id: p.id,
    display_name: p.display_name,
    custom_status: p.custom_status ?? "",
    user_status: (p.user_status ?? "active") as Profile["user_status"],
    created_at: p.created_at,
  }));
}

export async function fetchUserChannels(_userId: string): Promise<Channel[]> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_my_channels");
  if (error) throw error;
  return (data ?? []) as Channel[];
}

export async function fetchChannelMessages(channelIds: string[]): Promise<Message[]> {
  if (channelIds.length === 0) return [];
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_channel_messages", {
    p_channel_ids: channelIds,
  });
  if (error) throw error;
  return (data ?? []).map((m: {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    created_at: string;
    display_name: string;
    attachment_url: string | null;
    attachment_name: string | null;
    attachment_type: string | null;
  }) => ({
    id: m.id,
    channel_id: m.channel_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
    ...mapAttachmentFields(m),
    profiles: {
      id: m.user_id,
      display_name: m.display_name?.trim() || "Unknown",
      created_at: "",
      custom_status: "",
      user_status: "active",
    } as Profile,
  }));
}

export async function fetchChannelMembers(channelId: string): Promise<ChannelMember[]> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_channel_members", {
    p_channel_id: channelId,
  });
  if (error) throw error;

  return (data ?? []).map((row: {
    user_id: string;
    joined_at: string;
    profile_id: string;
    display_name: string;
    custom_status: string;
    user_status: string;
    profile_created_at: string;
  }) => {
    const profile: Profile = {
      id: row.profile_id,
      display_name: row.display_name,
      custom_status: row.custom_status ?? "",
      user_status: (row.user_status ?? "active") as Profile["user_status"],
      created_at: row.profile_created_at,
    };
    return {
      user_id: row.user_id,
      joined_at: row.joined_at,
      profile,
      member: toMember(profile),
    };
  });
}

export async function fetchUserDms(
  _userId: string,
  _profiles: Profile[]
): Promise<DirectMessage[]> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_my_dms");
  if (error) throw error;

  return (data ?? []).map((row: {
    conversation_id: string;
    other_user_id: string;
    other_display_name: string;
    other_user_status: string;
  }) => ({
    id: row.conversation_id,
    name: row.other_display_name,
    status:
      row.other_user_status === "dnd"
        ? "away"
        : row.other_user_status === "away"
          ? "away"
          : "active",
    user_id: row.other_user_id,
  }));
}

export async function fetchDmMessages(conversationIds: string[]): Promise<DmMessage[]> {
  if (conversationIds.length === 0) return [];
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_dm_messages", {
    p_conversation_ids: conversationIds,
  });
  if (error) throw error;

  return (data ?? []).map((m: {
    id: string;
    conversation_id: string;
    user_id: string;
    content: string;
    created_at: string;
    display_name: string;
    attachment_url: string | null;
    attachment_name: string | null;
    attachment_type: string | null;
  }) => ({
    id: m.id,
    dm_id: m.conversation_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
    ...mapAttachmentFields(m),
    profiles: {
      id: m.user_id,
      display_name: m.display_name?.trim() || "Unknown",
      created_at: "",
      custom_status: "",
      user_status: "active",
    } as Profile,
  }));
}

export async function createChannel(
  name: string,
  description: string | null,
  _userId: string
): Promise<Channel> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("create_channel", {
    channel_name: name,
    channel_description: description,
  });
  if (error) throw error;
  if (!data) throw new Error("Channel was not created");
  return data as Channel;
}

export async function addChannelMember(channelId: string, userId: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.rpc("add_channel_member", {
    p_channel_id: channelId,
    p_user_id: userId,
  });
  if (error) throw error;
}

export async function removeChannelMember(channelId: string, userId: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase
    .from("channel_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function sendChannelMessage(
  channelId: string,
  userId: string,
  content: string,
  attachment?: UploadedAttachment
): Promise<Message> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("send_channel_message", {
    p_channel_id: channelId,
    p_content: content,
    p_attachment_url: attachment?.url ?? null,
    p_attachment_name: attachment?.name ?? null,
    p_attachment_type: attachment?.type ?? null,
  });
  if (error) throw error;
  if (!data) throw new Error("Message was not created");

  const row = data as Message;
  return {
    id: row.id,
    channel_id: row.channel_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    ...mapAttachmentFields(row),
  };
}

export async function getOrCreateDm(
  _currentUserId: string,
  otherUserId: string
): Promise<string> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_or_create_dm", {
    p_other_user_id: otherUserId,
  });
  if (error) throw error;
  if (!data) throw new Error("Could not open conversation");
  return data as string;
}

export async function sendDmMessage(
  conversationId: string,
  userId: string,
  content: string,
  attachment?: UploadedAttachment
): Promise<DmMessage> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("send_dm_message", {
    p_conversation_id: conversationId,
    p_content: content,
    p_attachment_url: attachment?.url ?? null,
    p_attachment_name: attachment?.name ?? null,
    p_attachment_type: attachment?.type ?? null,
  });
  if (error) throw error;
  if (!data) throw new Error("Message was not created");

  const row = data as {
    id: string;
    conversation_id: string;
    user_id: string;
    content: string;
    created_at: string;
    attachment_url?: string | null;
    attachment_name?: string | null;
    attachment_type?: string | null;
  };
  return {
    id: row.id,
    dm_id: row.conversation_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    ...mapAttachmentFields(row),
  };
}

export async function updateProfile(
  userId: string,
  updates: { custom_status?: string; user_status?: string; display_name?: string }
): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

export function profilesToMembers(profiles: Profile[], currentUserId: string): Member[] {
  return profiles.map((p) => ({
    ...toMember(p),
    name: p.id === currentUserId ? `${p.display_name} (you)` : p.display_name,
  }));
}
