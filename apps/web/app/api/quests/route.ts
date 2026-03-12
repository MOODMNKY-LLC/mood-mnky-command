import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get("active") !== "false"

  let query = supabase
    .from("quests")
    .select("id, external_id, title, description, rule, xp_reward, cooldown_days, active")
    .order("title")

  if (activeOnly) {
    query = query.eq("active", true)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch quests", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ quests: data ?? [] })
}
