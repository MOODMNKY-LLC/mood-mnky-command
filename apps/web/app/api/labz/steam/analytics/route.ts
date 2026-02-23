import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSteamConfigured } from "@/lib/steam"

async function requireAdmin(): Promise<
  | { ok: true }
  | { ok: false; status: 401 }
  | { ok: false; status: 403 }
  | { ok: false; status: 503; message: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .single()
    const isAdmin = profile?.role === "admin" || profile?.is_admin === true
    if (!isAdmin) return { ok: false as const, status: 403 }
    return { ok: true as const }
  } catch (err) {
    console.error("[steam/analytics requireAdmin]", err)
    return {
      ok: false,
      status: 503,
      message:
        "Supabase error. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set and valid.",
    }
  }
}

/**
 * GET /api/labz/steam/analytics
 * Admin-only. Returns Steam config status and linked-account count for LABZ Steam page.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }

  try {
    const configured = isSteamConfigured()
    const realmSet = Boolean(process.env.STEAM_REALM)
    const returnUrlSet = Boolean(process.env.STEAM_RETURN_URL)

    let linkedCount = 0
    if (configured) {
      const admin = createAdminClient()
      const { count, error } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .not("steamid64", "is", null)
      if (!error && typeof count === "number") linkedCount = count
    }

    return NextResponse.json({
      configured,
      realmSet,
      returnUrlSet,
      linkedCount,
    })
  } catch (err) {
    console.error("[GET /api/labz/steam/analytics]", err)
    return NextResponse.json(
      { error: "Failed to load Steam analytics" },
      { status: 500 },
    )
  }
}
