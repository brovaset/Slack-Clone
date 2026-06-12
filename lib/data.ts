import { requireClient } from "@/lib/supabase/client";
import type {
  Channel,
  ChannelMember,
  DirectMessage,
  DmMessage,
  Member,
  Message,
  Profile,
} from "@/lib/types";

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
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, custom_status, user_status, created_at")
    .order("display_name");
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
  }) => ({
    id: m.id,
    channel_id: m.channel_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
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
  userId: string,
  profiles: Profile[]
): Promise<DirectMessage[]> {
  const supabase = requireClient();
  const { data: participations, error } = await supabase
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (error) throw error;
  if (!participations?.length) return [];

  const conversationIds = participations.map((p: { conversation_id: string }) => p.conversation_id);
  const { data: allParticipants, error: partError } = await supabase
    .from("dm_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds);
  if (partError) throw partError;

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const dms: DirectMessage[] = [];

  for (const convId of conversationIds) {
    const others = (allParticipants ?? [])
      .filter((p: { conversation_id: string; user_id: string }) => p.conversation_id === convId && p.user_id !== userId)
      .map((p: { user_id: string }) => profileMap.get(p.user_id))
      .filter(Boolean) as Profile[];

    if (others.length === 0) continue;
    const other = others[0];
    dms.push({
      id: convId,
      name: other.display_name,
      status: other.user_status === "dnd" ? "away" : other.user_status === "away" ? "away" : "active",
      user_id: other.id,
    });
  }

  return dms.sort((a, b) => a.name.localeCompare(b.name));
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
  }) => ({
    id: m.id,
    dm_id: m.conversation_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
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
  content: string
): Promise<Message> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("send_channel_message", {
    p_channel_id: channelId,
    p_content: content,
  });
  if (error) throw error;
  if (!data) throw new Error("Message was not created");

  const row = data as {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    created_at: string;
  };
  return {
    id: row.id,
    channel_id: row.channel_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
  };
}

export async function getOrCreateDm(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  const supabase = requireClient();

  const { data: myConvs, error: myError } = await supabase
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId);
  if (myError) throw myError;

  const myConvIds = (myConvs ?? []).map((c: { conversation_id: string }) => c.conversation_id);
  if (myConvIds.length > 0) {
    const { data: match, error: matchError } = await supabase
      .from("dm_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConvIds);
    if (matchError) throw matchError;
    if (match?.length) return match[0].conversation_id;
  }

  const { data: conversation, error: convError } = await supabase
    .from("dm_conversations")
    .insert({})
    .select("id")
    .single();
  if (convError) throw convError;

  const { error: selfPartError } = await supabase
    .from("dm_participants")
    .insert({ conversation_id: conversation.id, user_id: currentUserId });
  if (selfPartError) throw selfPartError;

  const { error: otherPartError } = await supabase
    .from("dm_participants")
    .insert({ conversation_id: conversation.id, user_id: otherUserId });
  if (otherPartError) throw otherPartError;

  return conversation.id;
}

export async function sendDmMessage(
  conversationId: string,
  userId: string,
  content: string
): Promise<DmMessage> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("send_dm_message", {
    p_conversation_id: conversationId,
    p_content: content,
  });
  if (error) throw error;
  if (!data) throw new Error("Message was not created");

  const row = data as {
    id: string;
    conversation_id: string;
    user_id: string;
    content: string;
    created_at: string;
  };
  return {
    id: row.id,
    dm_id: row.conversation_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
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
