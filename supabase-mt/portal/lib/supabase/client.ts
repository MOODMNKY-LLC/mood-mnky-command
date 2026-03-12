import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_MT_ANON_KEY;

/** Whether Supabase MT is configured (env vars set). */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function createClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase MT is not configured. Set NEXT_PUBLIC_SUPABASE_MT_URL and NEXT_PUBLIC_SUPABASE_MT_ANON_KEY in Vercel (or .env.local)."
    );
  }
  return createBrowserClient(url, anonKey);
}
