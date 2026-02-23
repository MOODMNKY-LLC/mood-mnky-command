import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { dashboardConfig } from "@/lib/dashboard-config"

/**
 * GET /api/labz/dashboard-config
 * Public. Returns merged dashboard config (DB overrides code) so the dashboard page
 * can use Settings-driven config without requiring admin.
 */
export async function GET() {
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
      defaultStatsRefreshInterval:
        (fromDb.defaultStatsRefreshInterval as number) ?? dashboardConfig.defaultStatsRefreshInterval,
      showLabzPagesCountInStats:
        (fromDb.showLabzPagesCountInStats as boolean) ?? dashboardConfig.showLabzPagesCountInStats,
      showConnectAlert: (fromDb.showConnectAlert as boolean) ?? dashboardConfig.showConnectAlert,
    }
    return NextResponse.json(merged)
  } catch (err) {
    console.error("[GET /api/labz/dashboard-config]", err)
    return NextResponse.json(
      { error: "Failed to load dashboard config" },
      { status: 500 },
    )
  }
}
