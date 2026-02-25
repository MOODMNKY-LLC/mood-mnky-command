import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLatestArtifactUrls } from "@/lib/services/infra-artifacts"

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
 * GET /api/labz/services/artifacts
 * Admin-only. Returns current theme/docker artifact URLs per service (for MNKY LABZ Service Analytics).
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })

  try {
    const admin = createAdminClient()
    const urls = await getLatestArtifactUrls(admin)
    return NextResponse.json(urls)
  } catch (err) {
    console.error("[GET /api/labz/services/artifacts]", err)
    return NextResponse.json(
      { error: "Failed to load artifact URLs" },
      { status: 500 },
    )
  }
}
