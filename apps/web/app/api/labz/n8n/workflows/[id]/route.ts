import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import {
  getN8nConfig,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  N8nApiError,
  type N8nWorkflow,
} from "@/lib/n8n/client"

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
    console.error("[n8n/workflows/[id] requireAdmin]", err)
    return { ok: false, status: 503, message: "Supabase error." }
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }
  const config = await getN8nConfig()
  if (!config) return NextResponse.json({ error: "n8n not configured." }, { status: 503 })
  const { id } = await params
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    const workflow = await getWorkflow(config, id)
    return NextResponse.json(workflow)
  } catch (err) {
    if (err instanceof N8nApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 404 ? 404 : err.status >= 500 ? 502 : err.status })
    }
    return NextResponse.json({ error: "Request failed" }, { status: 502 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }
  const config = await getN8nConfig()
  if (!config) return NextResponse.json({ error: "n8n not configured." }, { status: 503 })
  const { id } = await params
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be a workflow object" }, { status: 400 })
  }
  try {
    const workflow = await updateWorkflow(config, id, body as N8nWorkflow)
    return NextResponse.json(workflow)
  } catch (err) {
    if (err instanceof N8nApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 404 ? 404 : err.status >= 500 ? 502 : err.status })
    }
    return NextResponse.json({ error: "Request failed" }, { status: 502 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }
  const config = await getN8nConfig()
  if (!config) return NextResponse.json({ error: "n8n not configured." }, { status: 503 })
  const { id } = await params
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    const workflow = await deleteWorkflow(config, id)
    return NextResponse.json(workflow)
  } catch (err) {
    if (err instanceof N8nApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 404 ? 404 : err.status >= 500 ? 502 : err.status })
    }
    return NextResponse.json({ error: "Request failed" }, { status: 502 })
  }
}
