import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAllServicesAnalytics } from "@/lib/services"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) return { ok: false as const, status: 403 }
  return { ok: true as const }
}

/**
 * GET /api/labz/services/analytics
 * Admin-only. Returns status and metrics for all deployed services (for MNKY LABZ Service Analytics).
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })

  try {
    const data = await getAllServicesAnalytics()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[GET /api/labz/services/analytics]", err)
    return NextResponse.json(
      { error: "Failed to load service analytics" },
      { status: 500 },
    )
  }
}
