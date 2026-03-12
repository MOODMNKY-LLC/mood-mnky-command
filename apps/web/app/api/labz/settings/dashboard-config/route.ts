import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { dashboardConfig } from "@/lib/dashboard-config"

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
 * GET /api/labz/settings/dashboard-config
 * Admin-only. Returns merged config: DB values override code defaults.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })

  try {
    const admin = createAdminClient()
    const { data: rows } = await admin
      .from("dashboard_config")
      .select("key, value")
    const fromDb: Record<string, unknown> = {}
    for (const row of rows ?? []) {
      fromDb[row.key] = row.value
    }
    const merged = {
      sectionOrder: (fromDb.sectionOrder as string[]) ?? dashboardConfig.sectionOrder,
      showLabzHubCard: (fromDb.showLabzHubCard as boolean) ?? dashboardConfig.showLabzHubCard,
      defaultStatsRefreshInterval: (fromDb.defaultStatsRefreshInterval as number) ?? dashboardConfig.defaultStatsRefreshInterval,
      showLabzPagesCountInStats: (fromDb.showLabzPagesCountInStats as boolean) ?? dashboardConfig.showLabzPagesCountInStats,
      showConnectAlert: (fromDb.showConnectAlert as boolean) ?? dashboardConfig.showConnectAlert,
    }
    return NextResponse.json(merged)
  } catch (err) {
    console.error("[GET /api/labz/settings/dashboard-config]", err)
    return NextResponse.json(
      { error: "Failed to load dashboard config" },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/labz/settings/dashboard-config
 * Admin-only. Body: partial { sectionOrder, showLabzHubCard, ... }. Upserts into dashboard_config.
 */
export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })

  try {
    const body = await req.json() as Record<string, unknown>
    const admin = createAdminClient()
    const keys = [
      "sectionOrder",
      "showLabzHubCard",
      "defaultStatsRefreshInterval",
      "showLabzPagesCountInStats",
      "showConnectAlert",
    ] as const
    for (const key of keys) {
      if (body[key] === undefined) continue
      await admin
        .from("dashboard_config")
        .upsert(
          { key, value: body[key], updated_at: new Date().toISOString() },
          { onConflict: "key" },
        )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[PATCH /api/labz/settings/dashboard-config]", err)
    return NextResponse.json(
      { error: "Failed to update dashboard config" },
      { status: 500 },
    )
  }
}
