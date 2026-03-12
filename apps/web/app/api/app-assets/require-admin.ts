import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireInternalApiKey } from "@/lib/api/internal-auth"

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401; error: string }
  | { ok: false; status: 403; error: string }

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000"

/** Require admin (MOODMNKY_API_KEY or session with role admin / is_admin). Returns userId for media_assets ownership. */
export async function requireAppAssetsAdmin(request: Request): Promise<AuthResult> {
  if (requireInternalApiKey(request as unknown as Request)) {
    return { ok: true, userId: SYSTEM_USER_ID }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: "Unauthorized" }
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) return { ok: false, status: 403, error: "Admin only" }
  return { ok: true, userId: user.id }
}
