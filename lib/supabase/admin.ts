import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Admin client using service_role key -- bypasses RLS.
// ONLY use this server-side for admin operations.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
