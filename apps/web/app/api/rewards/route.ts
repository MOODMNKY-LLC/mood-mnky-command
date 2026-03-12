import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/rewards
 * Returns the active rewards catalog for the authenticated user.
 * Optional: filter by user's level (min_level) for display.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: rewards, error } = await supabase
    .from("rewards")
    .select("id, type, payload, min_level, active")
    .eq("active", true)
    .order("min_level", { ascending: true, nullsFirst: true })

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch rewards", details: error.message },
      { status: 500 }
    )
  }

  const list = (rewards ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    payload: r.payload as Record<string, unknown>,
    minLevel: r.min_level,
  }))

  return NextResponse.json({ rewards: list })
}
