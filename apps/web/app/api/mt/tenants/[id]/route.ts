import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createMTAdminClient, getMTConfigMissing } from "@mnky/mt-supabase"

const ALLOWED_STATUSES = ["active", "suspended", "archived"] as const

/**
 * PATCH /api/mt/tenants/[id] — Update tenant status (overseer only).
 * Body: { "status": "active" | "suspended" | "archived" }
 * Requires the caller to be a member of a platform-owner tenant.
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

  if (getMTConfigMissing()) {
    return NextResponse.json(
      { error: "Multi-tenant project not configured" },
      { status: 503 }
    )
  }

  const { id: tenantId } = await params
  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenant id" }, { status: 400 })
  }

  let body: { status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const status = body?.status
  if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json(
      { error: "Body must include status: one of active, suspended, archived" },
      { status: 400 }
    )
  }

  const mt = createMTAdminClient()
  const { data: isOwner, error: rpcError } = await mt.rpc("is_overseer", {
    p_user_id: user.id,
  })

  if (rpcError) {
    return NextResponse.json(
      { error: "Failed to check platform-owner membership", details: rpcError.message },
      { status: 500 }
    )
  }

  if (!isOwner) {
    return NextResponse.json(
      { error: "Forbidden: platform-owner membership required" },
      { status: 403 }
    )
  }

  const { data: tenant, error: updateError } = await mt
    .from("tenants")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", tenantId)
    .select("id, slug, name, status, updated_at")
    .single()

  if (updateError) {
    if (updateError.code === "PGRST116") {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Failed to update tenant", details: updateError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ tenant })
}
