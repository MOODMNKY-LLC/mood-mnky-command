import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_CONFIG_ERROR =
  'Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY). ' +
  'Local dev: add them to .env.local (or root .env); pnpm dev loads via dotenv.'

/** Service role key: prefer SUPABASE_SERVICE_ROLE_KEY, fallback to SUPABASE_SECRET_KEY (e.g. root .env.local). */
function getServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim()
  )
}

/**
 * Admin client using service_role key — bypasses RLS.
 * ONLY use server-side for admin operations (e.g. listing/updating all profiles).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = getServiceRoleKey()
  if (!url || !key) {
    throw new Error(SUPABASE_CONFIG_ERROR)
  }
  return createSupabaseClient(url, key)
}

/** Use when you need to detect missing config without throwing (e.g. optional features). */
export function getSupabaseConfigMissing(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = getServiceRoleKey()
  if (url && key) return null
  return !url ? 'NEXT_PUBLIC_SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY'
}
