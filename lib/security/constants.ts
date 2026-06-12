export const LIMITS = {
  message: 4000,
  channelName: 80,
  channelDescription: 250,
  displayName: 80,
  email: 254,
  status: 100,
  searchQuery: 200,
  workspaceName: 100,
  draft: 4000,
  fileName: 255,
} as const;

export const UPLOAD = {
  bucket: "chat-uploads",
  maxBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
  ],
} as const;

export const RATE_LIMITS = {
  message: { max: 30, windowMs: 60_000 },
  channel: { max: 5, windowMs: 600_000 },
  auth: { max: 8, windowMs: 900_000 },
} as const;

export const CHANNEL_NAME_PATTERN = /^[a-z0-9][a-z0-9-_]{0,79}$/;
