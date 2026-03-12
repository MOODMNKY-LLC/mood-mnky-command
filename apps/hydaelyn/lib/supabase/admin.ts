import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_CONFIG_ERROR =
  "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY. " +
  "Local dev: add them to .env.local at the repo root. " +
  "Vercel: add in Project Settings → Environment Variables.";

export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
  return createSupabaseClient(url, key);
}

export function getSupabaseConfigMissing(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return null;
  return !url
    ? "NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)"
    : "SUPABASE_SERVICE_ROLE_KEY";
}
