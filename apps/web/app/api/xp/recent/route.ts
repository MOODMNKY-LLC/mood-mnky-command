import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/xp/recent?limit=5
 * Returns the current user's most recent XP ledger entries (earn acknowledgment).
 * RLS: user can only select own rows.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "5", 10) || 5))

  const { data, error } = await supabase
    .from("xp_ledger")
    .select("source, source_ref, xp_delta, reason, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch recent XP", details: error.message },
      { status: 500 }
    )
  }

  const entries = (data ?? []).map((row) => ({
    source: row.source,
    sourceRef: row.source_ref ?? null,
    xpDelta: row.xp_delta,
    reason: row.reason ?? null,
    createdAt: row.created_at,
  }))

  return NextResponse.json({ entries })
}
