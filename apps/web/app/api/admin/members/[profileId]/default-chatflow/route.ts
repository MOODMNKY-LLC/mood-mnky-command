import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin(request: NextRequest) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) }
  }
  if (auth.isApiKey) {
    return {
      error: NextResponse.json(
        { error: "Session authentication required for member default chatflow" },
        { status: 403 }
      ),
    }
  }
  return { admin: createAdminClient() }
}

/**
 * PATCH /api/admin/members/[profileId]/default-chatflow
 * Body: { chatflowId: string | null }
 * Sets the member's default chatflow. If chatflowId is provided, it should be one of their assignments (optional validation).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 })
  }

  const result = await requireAdmin(request)
  if ("error" in result) return result.error
  const admin = result.admin

  let body: { chatflowId?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const chatflowId = body.chatflowId === undefined ? undefined : (body.chatflowId ?? null)

  if (chatflowId !== undefined && chatflowId !== null && typeof chatflowId !== "string") {
    return NextResponse.json({ error: "chatflowId must be a string or null" }, { status: 400 })
  }

  const value = typeof chatflowId === "string" ? chatflowId.trim() || null : null

  if (value) {
    const { data: assignment } = await admin
      .from("flowise_chatflow_assignments")
      .select("id")
      .eq("profile_id", profileId)
      .eq("chatflow_id", value)
      .maybeSingle()
    if (!assignment) {
      return NextResponse.json(
        { error: "Chatflow must be assigned to this member before setting as default" },
        { status: 400 }
      )
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ default_chatflow_id: value })
    .eq("id", profileId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ default_chatflow_id: value })
}
