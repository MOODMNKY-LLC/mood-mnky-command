/**
 * Shopify Customer Account API – Profile with metafields.
 * GET: Returns customer + metafields for prefill in Dojo.
 * POST: Syncs profile data to Supabase and Shopify metafields.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client"
import {
  getCustomerMetafields,
  setCustomerMetafields,
} from "@/lib/shopify/customer-account-metafields"

type ConflictField = { field: string; supabase: string | null; shopify: string | null }

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getCustomerAccessToken()
    if (!accessToken) {
      return NextResponse.json({
        linked: false,
        needsReconnect: false,
        customer: null,
        metafields: null,
        hasConflict: false,
        conflicts: null,
      })
    }
    const result = await getCustomerMetafields()
    if (!result) {
      return NextResponse.json({
        linked: true,
        needsReconnect: true,
        customer: null,
        metafields: null,
        hasConflict: false,
        conflicts: null,
      })
    }

    const url = new URL(request.url)
    const compare = url.searchParams.get("compare") === "1"

    let hasConflict = false
    let conflicts: ConflictField[] | null = null

    if (compare) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, bio, handle, preferences")
          .eq("id", user.id)
          .single()

        const m = result.metafields
        const prefs = (profile?.preferences as Record<string, unknown>) ?? {}
        const conflictsList: ConflictField[] = []

        const sbNick = profile?.display_name ?? null
        const shNick = m.nickname ?? null
        if (String(sbNick ?? "") !== String(shNick ?? "")) {
          conflictsList.push({ field: "nickname", supabase: sbNick ?? null, shopify: shNick ?? null })
        }
        const sbBio = profile?.bio ?? null
        const shBio = m.bio ?? null
        if (String(sbBio ?? "") !== String(shBio ?? "")) {
          conflictsList.push({ field: "bio", supabase: sbBio ?? null, shopify: shBio ?? null })
        }
        const sbHandle = profile?.handle ?? null
        const shHandle = m.verse_handle ?? null
        if (String(sbHandle ?? "") !== String(shHandle ?? "")) {
          conflictsList.push({ field: "verse_handle", supabase: sbHandle ?? null, shopify: shHandle ?? null })
        }

        if (conflictsList.length > 0) {
          hasConflict = true
          conflicts = conflictsList
        }
      }
    }

    return NextResponse.json({
      linked: true,
      needsReconnect: false,
      customer: result.customer,
      metafields: result.metafields,
      hasConflict,
      conflicts,
    })
  } catch {
    return NextResponse.json({
      linked: true,
      needsReconnect: true,
      customer: null,
      metafields: null,
      hasConflict: false,
      conflicts: null,
    })
  }
}

export interface SyncProfileBody {
  nickname?: string | null
  bio?: string | null
  verse_handle?: string | null
  fragrance_preferences?: string | null
  wishlist?: string[] | null
  size_preferences?: { clothing?: string; candle?: string; soap?: string } | null
  scent_personality?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = await getCustomerAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: "Shopify account not linked. Link your account first." },
        { status: 400 }
      )
    }

    const result = await getCustomerMetafields()
    if (!result) {
      return NextResponse.json(
        { error: "Could not fetch Shopify customer. Try reconnecting." },
        { status: 400 }
      )
    }

    const body = (await request.json()) as SyncProfileBody

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single()
    const existingPrefs = (existingProfile?.preferences as Record<string, unknown>) ?? {}

    const metafields: Array<{ key: string; type: string; value: string }> = []
    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      shopify_metafields_synced_at: new Date().toISOString(),
    }

    if (body.nickname !== undefined) {
      metafields.push({
        key: "nickname",
        type: "single_line_text_field",
        value: String(body.nickname ?? "").slice(0, 255),
      })
      profileUpdates.display_name = body.nickname || null
    }
    if (body.bio !== undefined) {
      metafields.push({
        key: "bio",
        type: "multi_line_text_field",
        value: String(body.bio ?? ""),
      })
      profileUpdates.bio = body.bio || null
    }
    if (body.verse_handle !== undefined) {
      const h = String(body.verse_handle ?? "").replace(/^@/, "").slice(0, 50)
      metafields.push({
        key: "verse_handle",
        type: "single_line_text_field",
        value: h ? `@${h}` : "",
      })
      profileUpdates.handle = h ? `@${h}` : null
    }
    if (body.fragrance_preferences !== undefined) {
      metafields.push({
        key: "fragrance_preferences",
        type: "json",
        value: typeof body.fragrance_preferences === "string"
          ? body.fragrance_preferences
          : JSON.stringify(body.fragrance_preferences ?? {}),
      })
    }
    if (body.wishlist !== undefined) {
      const arr = Array.isArray(body.wishlist) ? body.wishlist : []
      metafields.push({ key: "wishlist", type: "json", value: JSON.stringify(arr) })
      existingPrefs.wishlist = arr
    }
    if (body.size_preferences !== undefined) {
      const sp = body.size_preferences ?? {}
      metafields.push({ key: "size_preferences", type: "json", value: JSON.stringify(sp) })
      existingPrefs.size_preferences = sp
    }
    if (body.scent_personality !== undefined) {
      const sp = String(body.scent_personality ?? "").slice(0, 80)
      metafields.push({ key: "scent_personality", type: "single_line_text_field", value: sp })
      existingPrefs.scent_personality = sp || null
    }
    if (body.wishlist !== undefined || body.size_preferences !== undefined || body.scent_personality !== undefined) {
      profileUpdates.preferences = existingPrefs
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", user.id)

    if (profileError) {
      console.error("Profile update failed:", profileError)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    if (metafields.length > 0) {
      await setCustomerMetafields(result.customer.id, metafields)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Profile sync error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    )
  }
}
