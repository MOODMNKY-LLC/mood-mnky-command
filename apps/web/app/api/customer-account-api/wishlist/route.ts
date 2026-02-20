/**
 * POST /api/customer-account-api/wishlist
 * Add or remove a product/variant GID from wishlist.
 * Body: { action: "add" | "remove", gid: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client"
import {
  getCustomerMetafields,
  setCustomerMetafields,
} from "@/lib/shopify/customer-account-metafields"

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
        { error: "Shopify account not linked." },
        { status: 400 }
      )
    }

    const result = await getCustomerMetafields()
    if (!result) {
      return NextResponse.json(
        { error: "Could not fetch Shopify customer." },
        { status: 400 }
      )
    }

    const body = (await request.json()) as { action?: string; gid?: string }
    const action = body.action === "remove" ? "remove" : "add"
    const gid = String(body.gid ?? "").trim()
    if (!gid) {
      return NextResponse.json({ error: "gid required" }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single()

    const prefs = (profile?.preferences as Record<string, unknown>) ?? {}
    const current = Array.isArray(prefs.wishlist) ? (prefs.wishlist as string[]) : []

    let updated: string[]
    if (action === "add") {
      if (current.includes(gid)) {
        return NextResponse.json({ ok: true, wishlist: current })
      }
      updated = [...current, gid]
    } else {
      updated = current.filter((w) => w !== gid)
    }

    const newPrefs = { ...prefs, wishlist: updated }
    await supabase
      .from("profiles")
      .update({
        preferences: newPrefs,
        updated_at: new Date().toISOString(),
        shopify_metafields_synced_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    await setCustomerMetafields(result.customer.id, [
      { key: "wishlist", type: "json", value: JSON.stringify(updated) },
    ])

    return NextResponse.json({ ok: true, wishlist: updated })
  } catch (err) {
    console.error("Wishlist error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    )
  }
}
