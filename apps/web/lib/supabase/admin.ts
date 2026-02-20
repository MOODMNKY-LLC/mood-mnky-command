import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Admin client using service_role key -- bypasses RLS.
// ONLY use this server-side for admin operations.
// Accepts NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL (Vercel uses both).
export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env"
    )
  }
  return createSupabaseClient(url, key)
}
