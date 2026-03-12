import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"

export async function GET(request: NextRequest) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await auth.supabase
    .from("funnel_definitions")
    .select("id, name, description, provider_form_id, webhook_id, status, question_mapping, sandbox, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ funnels: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { name: string; description?: string; provider_form_id?: string; sandbox?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { name, description, provider_form_id, sandbox } = body
  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    )
  }

  const createdBy = auth.isApiKey ? null : (await auth.supabase.auth.getUser()).data.user?.id

  const { data, error } = await auth.supabase
    .from("funnel_definitions")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      provider: "jotform",
      provider_form_id: provider_form_id?.trim() || null,
      status: "draft",
      sandbox: !!sandbox,
      created_by: createdBy,
    })
    .select("id, name, provider_form_id, status")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A funnel with this JotForm form ID already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ funnel: data })
}
