import { publicSupabaseConfig } from "./public-config";

export function getSupabaseCredentials(): { url: string; key: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || publicSupabaseConfig.url;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    publicSupabaseConfig.key;

  return { url, key };
}
