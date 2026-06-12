import { UPLOAD } from "@/lib/security/constants";
import { sanitizeFileName } from "@/lib/security/sanitize";
import { requireClient } from "@/lib/supabase/client";

export interface UploadedAttachment {
  url: string;
  name: string;
  type: string;
}

export function validateChatUpload(file: File): string | null {
  if (file.size > UPLOAD.maxBytes) {
    return `File must be under ${UPLOAD.maxBytes / (1024 * 1024)} MB`;
  }
  const mime = file.type || "application/octet-stream";
  if (!(UPLOAD.allowedMimeTypes as readonly string[]).includes(mime)) {
    return "File type not allowed. Use images, PDF, or text files.";
  }
  return null;
}

export async function uploadChatFile(file: File, userId: string): Promise<UploadedAttachment> {
  const error = validateChatUpload(file);
  if (error) throw new Error(error);

  const supabase = requireClient();
  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(UPLOAD.bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(UPLOAD.bucket).getPublicUrl(path);

  return {
    url: data.publicUrl,
    name: safeName,
    type: file.type || "application/octet-stream",
  };
}

export function isImageAttachment(type: string | null | undefined): boolean {
  return !!type && type.startsWith("image/");
}
