import type {
  ActivityItem,
  Channel,
  DirectMessage,
  DmMessage,
  Draft,
  Member,
  Message,
} from "./types";

export const MOCK_CHANNELS: Channel[] = [
  {
    id: "ch-general",
    name: "general",
    description: "Company-wide announcements and work-based matters",
    created_at: "2026-06-01T09:00:00Z",
  },
  {
    id: "ch-random",
    name: "random",
    description: "Non-work banter and water cooler chat",
    created_at: "2026-06-01T09:00:00Z",
  },
  {
    id: "ch-design",
    name: "design",
    description: "Design critiques and Figma links",
    created_at: "2026-06-02T14:00:00Z",
  },
];

export const MOCK_DMS: DirectMessage[] = [
  { id: "dm-sarah", name: "Sarah Chen", status: "active", user_id: "user-sarah" },
  { id: "dm-marcus", name: "Marcus Webb", status: "away", user_id: "user-marcus" },
  { id: "dm-priya", name: "Priya Patel", status: "active", user_id: "user-priya" },
];

export const MOCK_MEMBERS: Member[] = [
  { id: "user-sarah", name: "Sarah Chen", title: "Product Manager", status: "active" },
  { id: "user-marcus", name: "Marcus Webb", title: "Engineer", status: "away" },
  { id: "user-priya", name: "Priya Patel", title: "Designer", status: "active" },
  { id: "user-james", name: "James Okafor", title: "Engineer", status: "active" },
  { id: "user-you", name: "You", title: "Team Member", status: "active" },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-1",
    channel_id: "ch-general",
    user_id: "user-sarah",
    content: "Morning team! Sprint planning is at 10am today.",
    created_at: "2026-06-08T14:02:00Z",
    profiles: { id: "user-sarah", display_name: "Sarah Chen", created_at: "" },
  },
  {
    id: "msg-2",
    channel_id: "ch-general",
    user_id: "user-marcus",
    content: "Got it — I'll have the API spec ready before then.",
    created_at: "2026-06-08T14:05:00Z",
    profiles: { id: "user-marcus", display_name: "Marcus Webb", created_at: "" },
  },
  {
    id: "msg-3",
    channel_id: "ch-general",
    user_id: "user-priya",
    content: "Design mocks are in Figma, link in #design",
    created_at: "2026-06-08T14:12:00Z",
    profiles: { id: "user-priya", display_name: "Priya Patel", created_at: "" },
  },
  {
    id: "msg-4",
    channel_id: "ch-random",
    user_id: "user-james",
    content: "Anyone want coffee? I'm heading to Blue Bottle.",
    created_at: "2026-06-08T15:30:00Z",
    profiles: { id: "user-james", display_name: "James Okafor", created_at: "" },
  },
  {
    id: "msg-5",
    channel_id: "ch-random",
    user_id: "user-sarah",
    content: "Oat milk latte please 🙏",
    created_at: "2026-06-08T15:31:00Z",
    profiles: { id: "user-sarah", display_name: "Sarah Chen", created_at: "" },
  },
  {
    id: "msg-6",
    channel_id: "ch-design",
    user_id: "user-priya",
    content: "Updated the sidebar spacing to match Slack's 260px width.",
    created_at: "2026-06-08T16:00:00Z",
    profiles: { id: "user-priya", display_name: "Priya Patel", created_at: "" },
  },
];

export const MOCK_DM_MESSAGES: DmMessage[] = [
  {
    id: "dm-msg-1",
    dm_id: "dm-sarah",
    user_id: "user-sarah",
    content: "Hey! Can you review the PR when you get a chance?",
    created_at: "2026-06-08T13:00:00Z",
    profiles: { id: "user-sarah", display_name: "Sarah Chen", created_at: "" },
  },
  {
    id: "dm-msg-2",
    dm_id: "dm-sarah",
    user_id: "user-you",
    content: "Sure, I'll take a look this afternoon.",
    created_at: "2026-06-08T13:05:00Z",
    profiles: { id: "user-you", display_name: "You", created_at: "" },
  },
  {
    id: "dm-msg-3",
    dm_id: "dm-marcus",
    user_id: "user-marcus",
    content: "Pushed the auth fix to staging.",
    created_at: "2026-06-08T11:00:00Z",
    profiles: { id: "user-marcus", display_name: "Marcus Webb", created_at: "" },
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    type: "mention",
    from: "Sarah Chen",
    message: "@you can you join the standup?",
    channel: "general",
    created_at: "2026-06-08T14:00:00Z",
  },
  {
    id: "act-2",
    type: "reaction",
    from: "Priya Patel",
    message: "reacted 👍 to your message",
    channel: "design",
    created_at: "2026-06-08T12:30:00Z",
  },
  {
    id: "act-3",
    type: "reply",
    from: "Marcus Webb",
    message: "replied in a thread: Looks good to me",
    channel: "general",
    created_at: "2026-06-08T10:00:00Z",
  },
];

export const MOCK_DRAFTS: Draft[] = [
  {
    id: "draft-1",
    target: "general",
    targetType: "channel",
    content: "Thanks everyone for the great sprint review...",
    updated_at: "2026-06-08T09:00:00Z",
  },
];

export const EMOJI_LIST = ["👍", "😂", "🎉", "❤️", "🙏", "👀", "✅", "🔥", "💯", "🚀", "😊", "🤔"];
