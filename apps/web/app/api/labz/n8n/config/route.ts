import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { getN8nConfig } from "@/lib/n8n/client"

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
    console.error("[n8n/config requireAdmin]", err)
    return {
      ok: false,
      status: 503,
      message: "Supabase error.",
    }
  }
}

/**
 * GET /api/labz/n8n/config
 * Admin-only. Returns { configured, baseUrl? }. baseUrl is masked unless ?forLink=1 (for "Open in n8n" link).
 */
export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }
  const config = await getN8nConfig()
  if (!config) {
    return NextResponse.json({
      configured: false,
      message:
        "Set N8N_API_URL and N8N_API_KEY in .env or configure mnky-auto in Platform → Settings.",
    })
  }
  const baseUrl = config.baseUrl
  const forLink = request.url && new URL(request.url).searchParams.get("forLink") === "1"
  const displayUrl = forLink
    ? baseUrl
    : baseUrl.length > 24
      ? `${baseUrl.slice(0, 8)}…${baseUrl.slice(-8)}`
      : baseUrl.replace(/^https?:\/\//, "")
  return NextResponse.json({ configured: true, baseUrl: displayUrl })
}
