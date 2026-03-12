import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  verifyShopifyProxySignature,
  getShopifyProxySecret,
  getLoggedInCustomerId,
} from "@/lib/shopify-app-proxy"

const VERSE_REWARDS_PATH = "/verse/rewards"

/**
 * GET /apps/mnky/api/balance
 * App proxy: returns XP balance and level for the logged-in Shopify customer.
 * Verify proxy signature; resolve profile by logged_in_customer_id; return xp_state.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = getShopifyProxySecret()
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfiguration", authenticated: false },
      { status: 500 }
    )
  }

  const { valid } = verifyShopifyProxySignature(searchParams, secret)
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid signature", authenticated: false },
      { status: 401 }
    )
  }

  const customerId = getLoggedInCustomerId(searchParams)
  if (!customerId) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const link = appUrl ? `${appUrl}${VERSE_REWARDS_PATH}` : VERSE_REWARDS_PATH
    return NextResponse.json({
      authenticated: false,
      message: "Log in to the store or view rewards in MNKY VERSE",
      link,
    })
  }

  const supabase = createAdminClient()
  // Normalize: Shopify may send numeric id; we store as string
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("shopify_customer_id", customerId)
    .maybeSingle()

  if (!profile) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const link = appUrl ? `${appUrl}${VERSE_REWARDS_PATH}` : VERSE_REWARDS_PATH
    return NextResponse.json({
      authenticated: true,
      customerId,
      xpTotal: 0,
      level: 1,
      updatedAt: new Date().toISOString(),
      message: "Profile not linked. Visit MNKY VERSE to link your account.",
      link,
    })
  }

  const { data: state } = await supabase
    .from("xp_state")
    .select("xp_total, level, updated_at")
    .eq("profile_id", profile.id)
    .maybeSingle()

  const xpTotal = state?.xp_total ?? 0
  const level = state?.level ?? 1
  const updatedAt = state?.updated_at ?? new Date().toISOString()

  return NextResponse.json({
    authenticated: true,
    xpTotal,
    level,
    updatedAt,
  })
}
