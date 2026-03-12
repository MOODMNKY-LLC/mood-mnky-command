import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"

const VALID_ROLES = ["admin", "moderator", "user", "pending"] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // API key auth should not be used for role updates (session-only for security)
  if (auth.isApiKey) {
    return NextResponse.json(
      { error: "Session authentication required for role updates" },
      { status: 403 }
    )
  }

  const { id: targetId } = await params
  if (!targetId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  let body: { role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { role } = body
  if (!role || typeof role !== "string") {
    return NextResponse.json(
      { error: "role is required (admin, moderator, user, pending)" },
      { status: 400 }
    )
  }

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update({ role })
    .eq("id", targetId)
    .select("id, role")
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
