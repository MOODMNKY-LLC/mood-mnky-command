import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit } from "@/lib/rate-limit"

function getPurchaseXpFromConfig(
  tiers: Array<{ subtotal_min: number; xp: number }>,
  subtotal: number
): number {
  const sorted = [...(tiers ?? [])].sort((a, b) => b.subtotal_min - a.subtotal_min)
  for (const t of sorted) {
    if (subtotal >= t.subtotal_min) return t.xp
  }
  return 0
}

/**
 * GET /apps/mnky/api/points-preview?subtotal=99.99
 * Returns potential XP for a given cart/product subtotal (no auth).
 * Uses same tier logic as shopify/order.paid; rate-limited by shop or IP.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subtotalRaw = searchParams.get("subtotal")
  const subtotal = parseFloat(subtotalRaw ?? "")
  if (Number.isNaN(subtotal) || subtotal < 0) {
    return NextResponse.json(
      { error: "Invalid subtotal", points: 0 },
      { status: 400 }
    )
  }

  const shop = searchParams.get("shop") ?? ""
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown"
  const identifier = `points-preview:${shop || ip}`
  const limit = await checkRateLimit(identifier)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests", points: 0 },
      { status: 429 }
    )
  }

  const supabase = createAdminClient()
  const { data: config } = await supabase
    .from("config_xp_rules")
    .select("value")
    .eq("key", "purchase")
    .maybeSingle()

  const tiers = (config?.value as { tiers?: Array<{ subtotal_min: number; xp: number }> } | null)
    ?.tiers
  const points =
    tiers?.length ?
      getPurchaseXpFromConfig(tiers, subtotal)
    : subtotal >= 75 ? 150
    : subtotal >= 25 ? 50
    : 0

  return NextResponse.json({ points, subtotal })
}
