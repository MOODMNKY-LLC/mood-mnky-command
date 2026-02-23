import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { getN8nConfig, activateWorkflow, N8nApiError } from "@/lib/n8n/client"

async function requireAdmin(): Promise<{ ok: true } | { ok: false; status: 401 } | { ok: false; status: 403 } | { ok: false; status: 503; message: string }> {
  const missing = getSupabaseConfigMissing()
  if (missing) return { ok: false, status: 503, message: `Supabase not configured. Set ${missing} in .env.local.` }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin.from("profiles").select("role, is_admin").eq("id", user.id).single()
    if (profile?.role !== "admin" && profile?.is_admin !== true) return { ok: false as const, status: 403 }
    return { ok: true as const }
  } catch {
    return { ok: false, status: 503, message: "Supabase error." }
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "message" in auth ? auth.message : "Unauthorized" }, { status: auth.status })
  const config = await getN8nConfig()
  if (!config) return NextResponse.json({ error: "n8n not configured." }, { status: 503 })
  const { id } = await params
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    const workflow = await activateWorkflow(config, id)
    return NextResponse.json(workflow)
  } catch (err) {
    if (err instanceof N8nApiError) return NextResponse.json({ error: err.message }, { status: err.status === 404 ? 404 : err.status >= 500 ? 502 : err.status })
    return NextResponse.json({ error: "Request failed" }, { status: 502 })
  }
}
