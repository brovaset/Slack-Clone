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

export async function fetchUserChannels(userId: string): Promise<Channel[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("channel_members")
    .select("channels(id, name, description, created_at)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });
  if (error) throw error;

  const channels: Channel[] = [];
  for (const row of data ?? []) {
    const ch = row.channels as unknown as Channel | null;
    if (ch) channels.push(ch);
  }
  return channels.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchChannelMessages(channelIds: string[]): Promise<Message[]> {
  if (channelIds.length === 0) return [];
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, channel_id, user_id, content, created_at, profiles(id, display_name, created_at)")
    .in("channel_id", channelIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m: {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: unknown;
  }) => ({
    id: m.id,
    channel_id: m.channel_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
    profiles: (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as Profile | undefined,
  }));
}

export async function fetchChannelMembers(channelId: string): Promise<ChannelMember[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("channel_members")
    .select("user_id, joined_at, profiles(id, display_name, custom_status, user_status, created_at)")
    .eq("channel_id", channelId)
    .order("joined_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row: {
    user_id: string;
    joined_at: string;
    profiles: unknown;
  }) => {
    const profile = row.profiles as Profile;
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
  const { data, error } = await supabase
    .from("dm_messages")
    .select("id, conversation_id, user_id, content, created_at, profiles(id, display_name, created_at)")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((m: {
    id: string;
    conversation_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: unknown;
  }) => ({
    id: m.id,
    dm_id: m.conversation_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
    profiles: m.profiles as Profile | undefined,
  }));
}

export async function createChannel(
  name: string,
  description: string | null,
  userId: string
): Promise<Channel> {
  const supabase = requireClient();
  const { data: channel, error } = await supabase
    .from("channels")
    .insert({ name, description })
    .select("id, name, description, created_at")
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase
    .from("channel_members")
    .insert({ channel_id: channel.id, user_id: userId });
  if (memberError) throw memberError;

  return channel;
}

export async function addChannelMember(channelId: string, userId: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase
    .from("channel_members")
    .insert({ channel_id: channelId, user_id: userId });
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
  const { data, error } = await supabase
    .from("messages")
    .insert({ channel_id: channelId, user_id: userId, content })
    .select("id, channel_id, user_id, content, created_at, profiles(id, display_name, created_at)")
    .single();
  if (error) throw error;
  const row = data as {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: unknown;
  };
  return {
    id: row.id,
    channel_id: row.channel_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profiles: (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as Profile | undefined,
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

  const { error: partError } = await supabase.from("dm_participants").insert([
    { conversation_id: conversation.id, user_id: currentUserId },
    { conversation_id: conversation.id, user_id: otherUserId },
  ]);
  if (partError) throw partError;

  return conversation.id;
}

export async function sendDmMessage(
  conversationId: string,
  userId: string,
  content: string
): Promise<DmMessage> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("dm_messages")
    .insert({ conversation_id: conversationId, user_id: userId, content })
    .select("id, conversation_id, user_id, content, created_at, profiles(id, display_name, created_at)")
    .single();
  if (error) throw error;

  return {
    id: data.id,
    dm_id: data.conversation_id,
    user_id: data.user_id,
    content: data.content,
    created_at: data.created_at,
    profiles: data.profiles as unknown as Profile | undefined,
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
