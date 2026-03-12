import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const SUPABASE_CONFIG_ERROR =
  "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY. " +
  "Local dev: add them to .env.local at the repo root; pnpm dev / pnpm dev:https load it via dotenv. " +
  "Vercel: add in Project Settings → Environment Variables."

// Admin client using service_role key -- bypasses RLS.
// ONLY use this server-side for admin operations.
// Accepts NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL (Vercel uses both).
export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(SUPABASE_CONFIG_ERROR)
  }
  return createSupabaseClient(url, key)
}

/** Use when you need to detect missing config without throwing (e.g. optional features). */
export function getSupabaseConfigMissing(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) return null
  return !url ? "NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)" : "SUPABASE_SERVICE_ROLE_KEY"
}
