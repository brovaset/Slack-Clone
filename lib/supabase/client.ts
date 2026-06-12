import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseCredentials } from "./config";

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (!client) {
    client = createBrowserClient(url, key);
  }
  return client;
}

export function requireClient(): SupabaseClient {
  const supabase = createClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
    );
  }
  return supabase;
}
