import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { isServiceConfiguredAsync } from "@/lib/services"
import { MAIN_SERVICES } from "@/lib/main-services-data"
import { isConfigured as notionConfigured } from "@/lib/notion"
import { isConfigured as shopifyConfigured } from "@/lib/shopify"
import { isDiscordConfigured } from "@/lib/discord/api"
import { isSteamConfigured } from "@/lib/steam"
import { isCredentialsEncryptionConfigured } from "@/lib/credentials-encrypt"

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
      message: `Supabase not configured. Set ${missing} in .env.local (and in Vercel → Project → Settings → Environment Variables for production).`,
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
    console.error("[credentials-status requireAdmin]", err)
    return {
      ok: false,
      status: 503,
      message:
        "Supabase error. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set and valid.",
    }
  }
}

/**
 * GET /api/labz/settings/credentials-status
 * Admin-only. Returns configured status for deployed services and integrations (Notion, Shopify).
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    const message = "message" in auth ? auth.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: auth.status })
  }

  try {
    const configured = await Promise.all(
      MAIN_SERVICES.map((s) => isServiceConfiguredAsync(s.id)),
    )
    const services = MAIN_SERVICES.map((s, i) => ({
      serviceId: s.id,
      name: s.name,
      configured: configured[i] ?? false,
    }))
    return NextResponse.json({
      services,
      notion: notionConfigured(),
      shopify: shopifyConfigured(),
      discord: isDiscordConfigured(),
      steam: isSteamConfigured(),
      encryptionConfigured: isCredentialsEncryptionConfigured(),
    })
  } catch (err) {
    console.error("[GET /api/labz/settings/credentials-status]", err)
    return NextResponse.json(
      { error: "Failed to load credentials status" },
      { status: 500 },
    )
  }
}
