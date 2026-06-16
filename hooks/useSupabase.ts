/**
 * Client Supabase access for components and hooks.
 * Prefer lib/data.ts for domain queries; use this for subscriptions or one-off calls.
 */
export { createClient } from "@/lib/supabase/client";
