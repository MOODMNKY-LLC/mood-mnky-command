import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { decryptCredentials, encryptCredentials } from "@/lib/credentials-encrypt"

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
      message: `Supabase not configured. Set ${missing} in .env.local and in Vercel for production.`,
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
    console.error("[deployed-services/[id] requireAdmin]", err)
    return {
      ok: false,
      status: 503,
      message:
        "Supabase error. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set and valid.",
    }
  }
}

/**
 * GET /api/labz/settings/deployed-services/[id]
 * Admin-only. Returns one row with decrypted credentials for edit form.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }

  const { id } = await params
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("deployed_services")
      .select("id, service_id, base_url, encrypted_credentials_json, enabled")
      .eq("id", id)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    let credentials: Record<string, unknown> | null = null
    if (data.encrypted_credentials_json) {
      const dec = decryptCredentials(data.encrypted_credentials_json)
      if (dec) {
        try {
          credentials = JSON.parse(dec) as Record<string, unknown>
        } catch {
          credentials = {}
        }
      }
    }
    return NextResponse.json({
      id: data.id,
      service_id: data.service_id,
      base_url: data.base_url,
      enabled: data.enabled,
      credentials,
    })
  } catch (err) {
    console.error("[GET /api/labz/settings/deployed-services/[id]]", err)
    return NextResponse.json(
      { error: "Failed to load deployed service" },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/labz/settings/deployed-services/[id]
 * Admin-only. Body: { base_url?, credentials?, enabled? }. Encrypts credentials if provided.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })

  const { id } = await params
  try {
    const body = await req.json() as {
      base_url?: string
      credentials?: Record<string, unknown>
      enabled?: boolean
    }
    const updates: { base_url?: string; encrypted_credentials_json?: string; enabled?: boolean; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }
    if (body.base_url !== undefined) updates.base_url = body.base_url ?? null
    if (body.enabled !== undefined) updates.enabled = body.enabled
    if (body.credentials !== undefined) {
      const encrypted = encryptCredentials(JSON.stringify(body.credentials))
      if (!encrypted) {
        return NextResponse.json(
          { error: "SERVICES_CREDENTIALS_ENCRYPTION_KEY not set" },
          { status: 400 },
        )
      }
      updates.encrypted_credentials_json = encrypted
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("deployed_services")
      .update(updates)
      .eq("id", id)
      .select("id, service_id, base_url, enabled")
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error("[PATCH /api/labz/settings/deployed-services/[id]]", err)
    return NextResponse.json(
      { error: "Failed to update deployed service" },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/labz/settings/deployed-services/[id]
 * Admin-only.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }

  const { id } = await params
  try {
    const admin = createAdminClient()
    const { error } = await admin.from("deployed_services").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/labz/settings/deployed-services/[id]]", err)
    return NextResponse.json(
      { error: "Failed to delete deployed service" },
      { status: 500 },
    )
  }
}
