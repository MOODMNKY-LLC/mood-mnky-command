import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("quests")
    .select("id, title, description, xp_reward, cooldown_days")
    .eq("active", true)
    .order("title")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quests: data ?? [] })
}
