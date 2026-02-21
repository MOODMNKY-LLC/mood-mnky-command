import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"
import { createAdminClient } from "@/lib/supabase/admin"

export type FlowiseAssignment = {
  id: string
  profile_id: string
  chatflow_id: string
  display_name: string | null
  override_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

async function requireAdmin(request: NextRequest) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) }
  }
  if (auth.isApiKey) {
    return {
      error: NextResponse.json(
        { error: "Session authentication required for member chatflow management" },
        { status: 403 }
      ),
    }
  }
  return { admin: createAdminClient() }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await context.params
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 })
  }
  const result = await requireAdmin(_request)
  if ("error" in result) return result.error
  const admin = result.admin
  const [assignmentsRes, profileRes] = await Promise.all([
    admin
      .from("flowise_chatflow_assignments")
      .select("id, profile_id, chatflow_id, display_name, override_config, created_at, updated_at")
      .eq("profile_id", profileId)
      .order("updated_at", { ascending: false }),
    admin.from("profiles").select("default_chatflow_id").eq("id", profileId).single(),
  ])
  if (assignmentsRes.error) return NextResponse.json({ error: assignmentsRes.error.message }, { status: 500 })
  const defaultChatflowId = (profileRes.data?.default_chatflow_id as string | null) ?? null
  return NextResponse.json({
    assignments: (assignmentsRes.data ?? []) as FlowiseAssignment[],
    defaultChatflowId,
  })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await context.params
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 })
  }
  const result = await requireAdmin(request)
  if ("error" in result) return result.error
  const admin = result.admin
  let body: { chatflowId?: string; displayName?: string; setAsDefault?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const chatflowId = body.chatflowId?.trim()
  if (!chatflowId) {
    return NextResponse.json({ error: "chatflowId is required" }, { status: 400 })
  }
  const { data: inserted, error: insertError } = await admin
    .from("flowise_chatflow_assignments")
    .insert({
      profile_id: profileId,
      chatflow_id: chatflowId,
      display_name: body.displayName?.trim() || null,
      override_config: {},
    })
    .select("id, profile_id, chatflow_id, display_name, override_config, created_at, updated_at")
    .single()
  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This chatflow is already assigned to this member" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }
  if (body.setAsDefault === true) {
    await admin.from("profiles").update({ default_chatflow_id: chatflowId }).eq("id", profileId)
  }
  return NextResponse.json({ assignment: inserted as FlowiseAssignment })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await context.params
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 })
  }
  const result = await requireAdmin(request)
  if ("error" in result) return result.error
  const admin = result.admin
  let body: { assignmentId?: string; chatflowId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const assignmentId = body.assignmentId?.trim()
  const chatflowId = body.chatflowId?.trim()
  if (!assignmentId && !chatflowId) {
    return NextResponse.json(
      { error: "Either assignmentId or chatflowId is required" },
      { status: 400 }
    )
  }
  let query = admin
    .from("flowise_chatflow_assignments")
    .delete()
    .eq("profile_id", profileId)
  if (assignmentId) query = query.eq("id", assignmentId)
  else query = query.eq("chatflow_id", chatflowId!)
  const { data: deletedRows, error: deleteError } = await query.select("chatflow_id")
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  const removedChatflowId = Array.isArray(deletedRows) ? deletedRows[0]?.chatflow_id : deletedRows?.chatflow_id
  if (removedChatflowId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("default_chatflow_id")
      .eq("id", profileId)
      .single()
    if (profile?.default_chatflow_id === removedChatflowId) {
      await admin.from("profiles").update({ default_chatflow_id: null }).eq("id", profileId)
    }
  }
  return NextResponse.json({ ok: true })
}
