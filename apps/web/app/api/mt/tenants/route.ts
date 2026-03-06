import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createMTAdminClient, getMTConfigMissing } from "@mnky/mt-supabase"

/**
 * GET /api/mt/tenants — List all tenants (overseer only).
 * Requires the caller to be a member of a platform-owner tenant (MOOD MNKY LLC).
 * Uses main Supabase for auth; MT project for tenant list.
 */
export async function GET() {
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

  const { data: tenants, error: listError } = await mt
    .from("tenants")
    .select("id, slug, name, status, is_platform_owner, created_at, updated_at")
    .order("created_at", { ascending: true })

  if (listError) {
    return NextResponse.json(
      { error: "Failed to list tenants", details: listError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ tenants: tenants ?? [] })
}
