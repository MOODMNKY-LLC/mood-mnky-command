/**
 * POST /api/customer-account-api/profile/pull
 * Bidirectional sync: fetch metafields from Shopify and update Supabase profiles.
 * Use when merchant has edited customer data in Admin or when resolving conflicts.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client"
import { getCustomerMetafields } from "@/lib/shopify/customer-account-metafields"

export async function POST() {
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
        { error: "Shopify account not linked." },
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

    const m = result.metafields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      shopify_metafields_synced_at: new Date().toISOString(),
    }

    if (m.nickname !== undefined) updates.display_name = m.nickname || null
    if (m.bio !== undefined) updates.bio = m.bio || null
    if (m.verse_handle !== undefined) {
      const h = String(m.verse_handle ?? "").replace(/^@/, "").trim()
      updates.handle = h ? `@${h}` : null
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single()

    const prefs = (existing?.preferences as Record<string, unknown>) ?? {}
    if (m.fragrance_preferences !== undefined) {
      try {
        const fp = JSON.parse(m.fragrance_preferences) as { favorite_notes?: string[] }
        if (Array.isArray(fp.favorite_notes)) prefs.favorite_notes = fp.favorite_notes
      } catch {
        /* ignore */
      }
    }
    if (m.wishlist !== undefined) {
      try {
        const arr = JSON.parse(m.wishlist) as string[]
        if (Array.isArray(arr)) prefs.wishlist = arr
      } catch {
        /* ignore */
      }
    }
    if (m.size_preferences !== undefined) {
      try {
        const sp = JSON.parse(m.size_preferences) as Record<string, string>
        if (sp && typeof sp === "object") prefs.size_preferences = sp
      } catch {
        /* ignore */
      }
    }
    if (m.scent_personality !== undefined) prefs.scent_personality = m.scent_personality || null

    updates.preferences = prefs

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)

    if (error) {
      console.error("Profile pull error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Profile pull error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pull failed" },
      { status: 500 }
    )
  }
}
