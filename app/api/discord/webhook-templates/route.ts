import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/webhook-templates — list all templates (admin only)
 * POST /api/discord/webhook-templates — body: { name: string, payload: object }
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from("discord_webhook_templates")
    .select("id, name, payload, created_at, updated_at")
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ templates: rows ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  let body: { name?: string; payload?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { name, payload } = body
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from("discord_webhook_templates")
    .insert({
      name: name.trim(),
      payload: payload ?? {},
    })
    .select("id, name, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(row)
}
