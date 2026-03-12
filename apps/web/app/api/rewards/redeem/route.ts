import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createDiscountCode } from "@/lib/shopify-admin-graphql"

function randomCodeSegment(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = ""
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { rewardId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const rewardId = body.rewardId
  if (!rewardId || typeof rewardId !== "string") {
    return NextResponse.json({ error: "rewardId required" }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: reward, error: rewardErr } = await admin
    .from("rewards")
    .select("id, type, payload, min_level")
    .eq("id", rewardId)
    .eq("active", true)
    .maybeSingle()

  if (rewardErr || !reward) {
    return NextResponse.json(
      { error: "Reward not found or inactive" },
      { status: 404 }
    )
  }

  const payload = (reward.payload ?? {}) as Record<string, unknown>
  const costXp = typeof payload.cost_xp === "number" ? payload.cost_xp : 0
  const minLevel = reward.min_level ?? 1

  const { data: xpState } = await admin
    .from("xp_state")
    .select("xp_total, level")
    .eq("profile_id", user.id)
    .maybeSingle()

  const xpTotal = xpState?.xp_total ?? 0
  const level = xpState?.level ?? 1

  if (xpTotal < costXp) {
    return NextResponse.json(
      { error: "Insufficient XP", required: costXp, current: xpTotal },
      { status: 400 }
    )
  }

  if (level < minLevel) {
    return NextResponse.json(
      { error: "Level too low", required: minLevel, current: level },
      { status: 400 }
    )
  }

  let externalRef: string | null = null

  if (reward.type === "discount_code") {
    const discountType = (payload.discount_type as string) ?? "amount"
    const discountValue = Number(payload.discount_value) || 5
    const codePrefix = (payload.code_prefix as string) ?? "MNKY"
    const code = `${codePrefix}-${randomCodeSegment(6)}`
    const now = new Date()
    const endsAt = new Date(now)
    endsAt.setDate(endsAt.getDate() + 30)

    const input =
      discountType === "percentage"
        ? {
            title: `MNKY Rewards ${discountValue}% off`,
            code,
            startsAt: now.toISOString(),
            endsAt: endsAt.toISOString(),
            appliesOncePerCustomer: true,
            discountPercentage: { value: discountValue },
          }
        : {
            title: `MNKY Rewards $${discountValue} off`,
            code,
            startsAt: now.toISOString(),
            endsAt: endsAt.toISOString(),
            appliesOncePerCustomer: true,
            discountAmount: { amount: discountValue, appliesOnEachItem: false },
          }

    const result = await createDiscountCode(input)
    if ("error" in result) {
      return NextResponse.json(
        { error: "Failed to create discount code", details: result.error },
        { status: 502 }
      )
    }
    externalRef = result.code
  }

  const { data: claim, error: claimErr } = await admin
    .from("reward_claims")
    .insert({
      profile_id: user.id,
      reward_id: reward.id,
      status: "issued",
      external_ref: externalRef,
    })
    .select("id, status, issued_at, external_ref")
    .single()

  if (claimErr || !claim) {
    return NextResponse.json(
      { error: "Failed to create claim", details: claimErr?.message },
      { status: 500 }
    )
  }

  if (costXp > 0) {
    await admin.rpc("award_xp", {
      p_profile_id: user.id,
      p_source: "redemption",
      p_source_ref: claim.id,
      p_xp_delta: -costXp,
      p_reason: `Redeemed reward ${reward.id}`,
    })
  }

  return NextResponse.json({
    claim: {
      id: claim.id,
      status: claim.status,
      issuedAt: claim.issued_at,
      externalRef: claim.external_ref,
    },
    code: externalRef ?? undefined,
  })
}
