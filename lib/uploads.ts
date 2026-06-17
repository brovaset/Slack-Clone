import { UPLOAD } from "@/lib/security/constants";
import { sanitizeFileName } from "@/lib/security/sanitize";
import { requireClient } from "@/lib/supabase/client";
import {
  formatUploadError,
  resolvedMimeForUpload,
  validateChatUpload,
} from "@/lib/uploadValidation";

export interface UploadedAttachment {
  url: string;
  name: string;
  type: string;
}

export { formatBytes, validateChatUpload } from "@/lib/uploadValidation";

export async function uploadChatFile(file: File, userId: string): Promise<UploadedAttachment> {
  const error = validateChatUpload(file);
  if (error) throw new Error(error);

  const supabase = requireClient();
  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const contentType = resolvedMimeForUpload(file);

  const { error: uploadError } = await supabase.storage
    .from(UPLOAD.bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

  if (uploadError) throw new Error(formatUploadError(uploadError));

  const { data } = supabase.storage.from(UPLOAD.bucket).getPublicUrl(path);

  return {
    url: data.publicUrl,
    name: safeName,
    type: contentType,
  };
}

export function isImageAttachment(type: string | null | undefined): boolean {
  return !!type && type.startsWith("image/");
}
