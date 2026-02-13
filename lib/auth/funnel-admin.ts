/**
 * Funnel admin API authentication.
 * Supports either session auth (admin user) or API key (x-api-key header).
 * When API key is used, returns admin Supabase client (bypasses RLS).
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type FunnelAuthResult =
  | { ok: true; supabase: SupabaseClient; isApiKey: boolean }
  | { ok: false; status: number; error: string }

export async function authenticateFunnelAdmin(
  request: NextRequest
): Promise<FunnelAuthResult> {
  const apiKey = request.headers.get("x-api-key")
  const funnelAdminKey = process.env.FUNNEL_ADMIN_API_KEY

  if (funnelAdminKey && apiKey === funnelAdminKey) {
    return {
      ok: true,
      supabase: createAdminClient(),
      isApiKey: true,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" }
  }

  // Use admin client to fetch profile so RLS cannot block the check.
  // We already validated the user is authenticated; this gets authoritative role/is_admin.
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()

  // Support both role and is_admin for backward compatibility
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) {
    return { ok: false, status: 403, error: "Admin role required" }
  }

  return {
    ok: true,
    supabase,
    isApiKey: false,
  }
}
