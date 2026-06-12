import { generatedSupabaseConfig } from "./config.generated";

export function getSupabaseCredentials(): { url: string; key: string } {
  if (generatedSupabaseConfig.url && generatedSupabaseConfig.key) {
    return generatedSupabaseConfig;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return { url, key };
}
