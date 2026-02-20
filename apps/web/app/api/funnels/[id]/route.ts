import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { data, error } = await auth.supabase
    .from("funnel_definitions")
    .select("id, name, description, provider_form_id, webhook_id, status, question_mapping, sandbox, created_at, updated_at")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 })
  }

  return NextResponse.json({ funnel: data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  let body: {
    name?: string
    description?: string
    status?: string
    question_mapping?: Record<string, string>
    sandbox?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() ?? null
  if (body.status !== undefined) updates.status = body.status
  if (body.question_mapping !== undefined) updates.question_mapping = body.question_mapping
  if (body.sandbox !== undefined) updates.sandbox = body.sandbox

  const { data, error } = await auth.supabase
    .from("funnel_definitions")
    .update(updates)
    .eq("id", id)
    .select("id, name, description, provider_form_id, webhook_id, status, question_mapping, sandbox, created_at, updated_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ funnel: data })
}
