import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/me/free-tier-prompt-dismiss
 * Sets preferences.free_tier_prompt_dismissed_at so the Dojo onboarding card is hidden for 7 days.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .single()

  const prefs = (profile?.preferences as Record<string, unknown>) ?? {}
  const updated = {
    ...prefs,
    free_tier_prompt_dismissed_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: updated, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
