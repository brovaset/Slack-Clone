import type { DmMessage, Member, Message } from "@/lib/types";

export function messageSenderName(
  message: Message | DmMessage,
  members: Member[]
): string {
  const fromProfile = message.profiles?.display_name?.trim();
  if (fromProfile) return fromProfile;

  const member = members.find((m) => m.id === message.user_id);
  if (member) return member.name.replace(/ \(you\)$/, "");

  return "Unknown";
}

export function formatMessageTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateDivider(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getAvatarColor(name: string) {
  const colors = ["#611f69", "#2BAC76", "#E01E5A", "#ECB22E", "#36C5F0", "#4A154B"];
  return colors[name.charCodeAt(0) % colors.length];
}
