import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("xp_state")
    .select("xp_total, level, updated_at")
    .eq("profile_id", user.id)
    .single()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Failed to fetch XP state", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    xpTotal: data?.xp_total ?? 0,
    level: data?.level ?? 1,
    updatedAt: data?.updated_at ?? null,
  })
}
