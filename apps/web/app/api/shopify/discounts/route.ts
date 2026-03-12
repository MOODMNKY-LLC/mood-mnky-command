import { NextResponse } from "next/server"
import { getPriceRules, getDiscountCodes, getPriceRuleCount, getGiftCards, getGiftCardCount, isConfigured } from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "price_rules"
    const countOnly = searchParams.get("count") === "true"

    if (type === "gift_cards") {
      if (countOnly) return NextResponse.json({ count: await getGiftCardCount() })
      const giftCards = await getGiftCards({ limit: 50 })
      return NextResponse.json({ gift_cards: giftCards })
    }

    if (countOnly) return NextResponse.json({ count: await getPriceRuleCount() })

    const priceRules = await getPriceRules({ limit: 50 })
    // Fetch discount codes for each rule
    const rulesWithCodes = await Promise.all(
      priceRules.map(async (rule) => {
        const codes = await getDiscountCodes(rule.id)
        return { ...rule, discount_codes: codes }
      })
    )
    return NextResponse.json({ price_rules: rulesWithCodes })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
