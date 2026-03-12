import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { getN8nConfig, getExecution, N8nApiError } from "@/lib/n8n/client"

async function requireAdmin(): Promise<
  | { ok: true }
  | { ok: false; status: 401 }
  | { ok: false; status: 403 }
  | { ok: false; status: 503; message: string }
> {
  const missing = getSupabaseConfigMissing()
  if (missing) {
    return {
      ok: false,
      status: 503,
      message: `Supabase not configured. Set ${missing} in .env.local.`,
    }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .single()
    const isAdmin = profile?.role === "admin" || profile?.is_admin === true
    if (!isAdmin) return { ok: false as const, status: 403 }
    return { ok: true as const }
  } catch (err) {
    console.error("[n8n/executions/[id] requireAdmin]", err)
    return { ok: false, status: 503, message: "Supabase error." }
  }
}

/**
 * GET /api/labz/n8n/executions/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }
  const config = await getN8nConfig()
  if (!config) {
    return NextResponse.json(
      { error: "n8n not configured." },
      { status: 503 }
    )
  }
  const { id } = await params
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const includeData =
    request.nextUrl.searchParams.get("includeData") === "true"
  try {
    const execution = await getExecution(config, id, includeData)
    return NextResponse.json(execution)
  } catch (err) {
    if (err instanceof N8nApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status === 404 ? 404 : err.status >= 500 ? 502 : err.status }
      )
    }
    console.error("[GET /api/labz/n8n/executions/[id]]", err)
    return NextResponse.json({ error: "Request failed" }, { status: 502 })
  }
}
