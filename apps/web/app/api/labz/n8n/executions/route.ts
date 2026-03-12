import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { getN8nConfig, listExecutions, N8nApiError } from "@/lib/n8n/client"

async function requireAdmin(): Promise<
  | { ok: true }
  | { ok: false; status: 401 }
  | { ok: false; status: 403 }
  | { ok: false; status: 503; message: string }
> {
  const missing = getSupabaseConfigMissing()
  if (missing) {
    return { ok: false, status: 503, message: `Supabase not configured. Set ${missing} in .env.local.` }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin.from("profiles").select("role, is_admin").eq("id", user.id).single()
    const isAdmin = profile?.role === "admin" || profile?.is_admin === true
    if (!isAdmin) return { ok: false as const, status: 403 }
    return { ok: true as const }
  } catch (err) {
    console.error("[n8n/executions requireAdmin]", err)
    return { ok: false, status: 503, message: "Supabase error." }
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }
  const config = await getN8nConfig()
  if (!config) {
    return NextResponse.json(
      { error: "n8n not configured. Set N8N_API_URL and N8N_API_KEY or configure mnky-auto in Settings." },
      { status: 503 }
    )
  }
  const { searchParams } = request.nextUrl
  const workflowId = searchParams.get("workflowId") ?? undefined
  const status = searchParams.get("status") as "error" | "success" | "waiting" | undefined
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined
  const cursor = searchParams.get("cursor") ?? undefined
  try {
    const result = await listExecutions(config, { workflowId, status, limit, cursor })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof N8nApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 500 ? 502 : err.status })
    }
    console.error("[GET /api/labz/n8n/executions]", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Request failed" }, { status: 502 })
  }
}
