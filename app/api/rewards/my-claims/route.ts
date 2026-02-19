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
    .from("reward_claims")
    .select(
      `
      id,
      status,
      issued_at,
      rewards (
        id,
        type,
        payload,
        min_level
      )
    `
    )
    .eq("profile_id", user.id)
    .order("issued_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch claims", details: error.message },
      { status: 500 }
    )
  }

  const claims = (data ?? []).map((c) => ({
    id: c.id,
    status: c.status,
    issuedAt: c.issued_at,
    reward: c.rewards
      ? {
          id: (c.rewards as { id: string }).id,
          type: (c.rewards as { type: string }).type,
          payload: (c.rewards as { payload: Record<string, unknown> }).payload,
          minLevel: (c.rewards as { min_level: number | null }).min_level,
        }
      : null,
  }))

  return NextResponse.json({ claims })
}
