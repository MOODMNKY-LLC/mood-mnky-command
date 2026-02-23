import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { encryptCredentials } from "@/lib/credentials-encrypt"

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
      message: `Supabase not configured. Set ${missing} in .env.local (and in Vercel → Settings → Environment Variables for production).`,
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
    console.error("[deployed-services requireAdmin]", err)
    return {
      ok: false,
      status: 503,
      message:
        "Supabase error. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set and valid.",
    }
  }
}

/**
 * GET /api/labz/settings/deployed-services
 * Admin-only. Returns list without decrypted credentials (id, service_id, base_url, enabled).
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("deployed_services")
      .select("id, service_id, base_url, enabled, created_at, updated_at")
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error("[GET /api/labz/settings/deployed-services]", err)
    return NextResponse.json(
      { error: "Failed to list deployed services. Ensure the deployed_services table exists (run Supabase migrations)." },
      { status: 500 },
    )
  }
}

/**
 * POST /api/labz/settings/deployed-services
 * Admin-only. Body: { service_id, base_url?, credentials: object }. Encrypts credentials and inserts.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { service_id, base_url, credentials } = body as {
      service_id: string
      base_url?: string
      credentials?: Record<string, unknown>
    }
    if (!service_id || typeof service_id !== "string") {
      return NextResponse.json({ error: "service_id required" }, { status: 400 })
    }

    const encrypted = credentials != null
      ? encryptCredentials(JSON.stringify(credentials))
      : null
    if (credentials != null && !encrypted) {
      return NextResponse.json(
        { error: "SERVICES_CREDENTIALS_ENCRYPTION_KEY not set or too short" },
        { status: 400 },
      )
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("deployed_services")
      .insert({
        service_id,
        base_url: base_url ?? null,
        encrypted_credentials_json: encrypted,
        enabled: true,
      })
      .select("id, service_id, base_url, enabled")
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error("[POST /api/labz/settings/deployed-services]", err)
    return NextResponse.json(
      { error: "Failed to create deployed service" },
      { status: 500 },
    )
  }
}
