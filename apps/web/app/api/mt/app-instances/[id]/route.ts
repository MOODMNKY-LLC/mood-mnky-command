import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createMTAdminClient, getMTConfigMissing } from "@mnky/mt-supabase"

async function requireOverseer(userId: string) {
  if (getMTConfigMissing()) {
    return NextResponse.json(
      { error: "Multi-tenant project not configured" },
      { status: 503 }
    )
  }
  const mt = createMTAdminClient()
  const { data: isOwner, error: rpcError } = await mt.rpc("is_overseer", {
    p_user_id: userId,
  })
  if (rpcError) {
    return NextResponse.json(
      { error: "Failed to check overseer status", details: rpcError.message },
      { status: 500 }
    )
  }
  if (!isOwner) {
    return NextResponse.json(
      { error: "Forbidden: platform-owner membership required" },
      { status: 403 }
    )
  }
  return null
}

/**
 * PATCH /api/mt/app-instances/[id] — Update app instance (overseer only).
 * Body: { base_url?, api_key_encrypted?, settings? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mainSupabase = await createClient()
  const {
    data: { user },
  } = await mainSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const err = await requireOverseer(user.id)
  if (err) return err

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  let body: {
    base_url?: string | null
    api_key_encrypted?: string | null
    settings?: Record<string, unknown>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.base_url !== undefined) updates.base_url = body.base_url
  if (body.api_key_encrypted !== undefined) updates.api_key_encrypted = body.api_key_encrypted
  if (body.settings !== undefined) updates.settings = body.settings

  const mt = createMTAdminClient()
  const { data: row, error } = await mt
    .from("tenant_app_instances")
    .update(updates)
    .eq("id", id)
    .select("id, tenant_id, app_type, base_url, settings, created_at, updated_at")
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "App instance not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Failed to update app instance", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ appInstance: row })
}

/**
 * DELETE /api/mt/app-instances/[id] — Delete app instance (overseer only).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mainSupabase = await createClient()
  const {
    data: { user },
  } = await mainSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const err = await requireOverseer(user.id)
  if (err) return err

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const mt = createMTAdminClient()
  const { error } = await mt.from("tenant_app_instances").delete().eq("id", id)

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "App instance not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Failed to delete app instance", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
