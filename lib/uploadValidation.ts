import { UPLOAD } from "@/lib/security/constants";

export const ALLOWED_FILE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".txt",
] as const;

const EXTENSION_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

const BLOCKED_MIME_PREFIXES = ["application/javascript", "text/javascript"];
const BLOCKED_MIME_EXACT = [
  "application/x-msdownload",
  "application/x-executable",
  "application/vnd.microsoft.portable-executable",
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot).toLowerCase() : "";
}

function resolvedMime(file: File): string {
  const reported = file.type?.trim();
  if (reported && reported !== "application/octet-stream") return reported;

  const fromExt = EXTENSION_TO_MIME[fileExtension(file.name)];
  return fromExt ?? reported ?? "application/octet-stream";
}

export function resolvedMimeForUpload(file: File): string {
  return resolvedMime(file);
}

function isBlockedMime(mime: string): boolean {
  if (BLOCKED_MIME_EXACT.includes(mime)) return true;
  return BLOCKED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

export function isAllowedUpload(file: File): boolean {
  const mime = resolvedMime(file);
  if (isBlockedMime(mime)) return false;

  const ext = fileExtension(file.name);
  const mimeAllowed = (UPLOAD.allowedMimeTypes as readonly string[]).includes(mime);
  const extAllowed = ALLOWED_FILE_EXTENSIONS.includes(
    ext as (typeof ALLOWED_FILE_EXTENSIONS)[number]
  );

  if (mimeAllowed) return true;
  if (extAllowed && (!file.type || file.type === "application/octet-stream")) return true;
  return false;
}

export function validateChatUpload(file: File): string | null {
  if (!file.name?.trim()) return "Invalid file.";
  if (file.size <= 0) return "File is empty.";

  if (file.size > UPLOAD.maxBytes) {
    return `File is too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(UPLOAD.maxBytes)}.`;
  }

  if (!isAllowedUpload(file)) {
    return "File type not allowed. Use JPEG, PNG, GIF, WebP, PDF, or TXT.";
  }

  return null;
}

export function formatUploadError(err: unknown, fallback = "Failed to upload file"): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : "";

  const msg = raw.trim();
  if (!msg) return fallback;

  if (/payload too large|exceeded.*size|file_size_limit|too large/i.test(msg)) {
    return `File is too large. Maximum size is ${formatBytes(UPLOAD.maxBytes)}.`;
  }
  if (/mime|not allowed|invalid file type|unsupported/i.test(msg)) {
    return "File type not allowed. Use JPEG, PNG, GIF, WebP, PDF, or TXT.";
  }
  return msg;
}
