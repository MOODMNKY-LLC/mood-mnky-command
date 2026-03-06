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
 * GET /api/mt/app-instances?tenantId= — List app instances for a tenant (overseer only).
 */
export async function GET(request: NextRequest) {
  const mainSupabase = await createClient()
  const {
    data: { user },
  } = await mainSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const err = await requireOverseer(user.id)
  if (err) return err

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing query parameter: tenantId" },
      { status: 400 }
    )
  }

  const mt = createMTAdminClient()
  const { data: rows, error } = await mt
    .from("tenant_app_instances")
    .select("id, tenant_id, app_type, base_url, settings, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("app_type", { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: "Failed to list app instances", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ appInstances: rows ?? [] })
}

/**
 * POST /api/mt/app-instances — Create app instance for a tenant (overseer only).
 * Body: { tenantId, app_type, base_url?, api_key_encrypted?, settings? }
 */
export async function POST(request: NextRequest) {
  const mainSupabase = await createClient()
  const {
    data: { user },
  } = await mainSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const err = await requireOverseer(user.id)
  if (err) return err

  let body: {
    tenantId?: string
    app_type?: string
    base_url?: string | null
    api_key_encrypted?: string | null
    settings?: Record<string, unknown>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { tenantId, app_type, base_url, api_key_encrypted, settings } = body
  if (!tenantId || !app_type || typeof app_type !== "string") {
    return NextResponse.json(
      { error: "Body must include tenantId and app_type (string)" },
      { status: 400 }
    )
  }

  const mt = createMTAdminClient()
  const { data: row, error } = await mt
    .from("tenant_app_instances")
    .insert({
      tenant_id: tenantId,
      app_type: app_type.trim().toLowerCase(),
      base_url: base_url ?? null,
      api_key_encrypted: api_key_encrypted ?? null,
      settings: settings ?? {},
    })
    .select("id, tenant_id, app_type, base_url, settings, created_at, updated_at")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "An app instance for this tenant and app_type already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create app instance", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ appInstance: row })
}
