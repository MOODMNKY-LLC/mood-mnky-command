import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateFragrancePage, isConfigured, type FragranceOilUpdate } from "@/lib/notion"
import type { FragranceFamily } from "@/lib/types"

function toDbUpdate(updates: FragranceOilUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) row.name = updates.name
  if (updates.description !== undefined) row.description = updates.description
  if (updates.family !== undefined) row.family = updates.family
  if (updates.type !== undefined) row.type = updates.type
  if (updates.subfamilies !== undefined) row.subfamilies = updates.subfamilies
  if (updates.topNotes !== undefined) row.top_notes = updates.topNotes
  if (updates.middleNotes !== undefined) row.middle_notes = updates.middleNotes
  if (updates.baseNotes !== undefined) row.base_notes = updates.baseNotes
  if (updates.alternativeBranding !== undefined) row.alternative_branding = updates.alternativeBranding
  if (updates.candleSafe !== undefined) row.candle_safe = updates.candleSafe
  if (updates.soapSafe !== undefined) row.soap_safe = updates.soapSafe
  if (updates.lotionSafe !== undefined) row.lotion_safe = updates.lotionSafe
  if (updates.perfumeSafe !== undefined) row.perfume_safe = updates.perfumeSafe
  if (updates.roomSpraySafe !== undefined) row.room_spray_safe = updates.roomSpraySafe
  if (updates.waxMeltSafe !== undefined) row.wax_melt_safe = updates.waxMeltSafe
  if (updates.maxUsageCandle !== undefined) row.max_usage_candle = updates.maxUsageCandle
  if (updates.maxUsageSoap !== undefined) row.max_usage_soap = updates.maxUsageSoap
  if (updates.maxUsageLotion !== undefined) row.max_usage_lotion = updates.maxUsageLotion
  if (updates.price1oz !== undefined) row.price_1oz = updates.price1oz
  if (updates.price4oz !== undefined) row.price_4oz = updates.price4oz
  if (updates.price16oz !== undefined) row.price_16oz = updates.price16oz
  if (updates.rating !== undefined) row.rating = updates.rating
  if (updates.reviewCount !== undefined) row.review_count = updates.reviewCount
  if (updates.blendsWellWith !== undefined) row.blends_well_with = updates.blendsWellWith
  if (updates.suggestedColors !== undefined) row.suggested_colors = updates.suggestedColors
  if (updates.allergenStatement !== undefined) row.allergen_statement = updates.allergenStatement
  return row
}

function parseBody(body: unknown): FragranceOilUpdate | null {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  const updates: FragranceOilUpdate = {}
  if (typeof o.name === "string") updates.name = o.name
  if (typeof o.description === "string") updates.description = o.description
  if (typeof o.family === "string") updates.family = o.family as FragranceFamily
  if (Array.isArray(o.subfamilies)) updates.subfamilies = o.subfamilies.filter((x): x is string => typeof x === "string")
  if (Array.isArray(o.topNotes)) updates.topNotes = o.topNotes.filter((x): x is string => typeof x === "string")
  if (Array.isArray(o.middleNotes)) updates.middleNotes = o.middleNotes.filter((x): x is string => typeof x === "string")
  if (Array.isArray(o.baseNotes)) updates.baseNotes = o.baseNotes.filter((x): x is string => typeof x === "string")
  if (typeof o.type === "string") updates.type = o.type
  if (Array.isArray(o.alternativeBranding)) updates.alternativeBranding = o.alternativeBranding.filter((x): x is string => typeof x === "string")
  if (typeof o.candleSafe === "boolean") updates.candleSafe = o.candleSafe
  if (typeof o.soapSafe === "boolean") updates.soapSafe = o.soapSafe
  if (typeof o.lotionSafe === "boolean") updates.lotionSafe = o.lotionSafe
  if (typeof o.perfumeSafe === "boolean") updates.perfumeSafe = o.perfumeSafe
  if (typeof o.roomSpraySafe === "boolean") updates.roomSpraySafe = o.roomSpraySafe
  if (typeof o.waxMeltSafe === "boolean") updates.waxMeltSafe = o.waxMeltSafe
  const num = (v: unknown): number | undefined => {
    const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN
    return !Number.isNaN(n) ? n : undefined
  }
  const n = num(o.maxUsageCandle)
  if (n !== undefined) updates.maxUsageCandle = n
  const n2 = num(o.maxUsageSoap)
  if (n2 !== undefined) updates.maxUsageSoap = n2
  const n3 = num(o.maxUsageLotion)
  if (n3 !== undefined) updates.maxUsageLotion = n3
  const p1 = num(o.price1oz)
  if (p1 !== undefined) updates.price1oz = p1
  const p4 = num(o.price4oz)
  if (p4 !== undefined) updates.price4oz = p4
  const p16 = num(o.price16oz)
  if (p16 !== undefined) updates.price16oz = p16
  const r = num(o.rating)
  if (r !== undefined) updates.rating = r
  const rc = num(o.reviewCount)
  if (rc !== undefined) updates.reviewCount = rc
  if (Array.isArray(o.blendsWellWith)) updates.blendsWellWith = o.blendsWellWith.filter((x): x is string => typeof x === "string")
  if (Array.isArray(o.suggestedColors)) updates.suggestedColors = o.suggestedColors.filter((x): x is string => typeof x === "string")
  if (o.allergenStatement === null || typeof o.allergenStatement === "string") updates.allergenStatement = o.allergenStatement ?? null
  return Object.keys(updates).length > 0 ? updates : null
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = parseBody(await _request.json().catch(() => null))
  if (!body) {
    return NextResponse.json({ error: "Invalid or empty update body" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: existing, error: fetchError } = await supabase
    .from("fragrance_oils")
    .select("id, notion_id")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Fragrance oil not found" }, { status: 404 })
  }

  const notionId = (existing.notion_id as string | null) ?? null

  const dbUpdate = toDbUpdate(body)
  if (Object.keys(dbUpdate).length > 1) {
    const { error: updateError } = await supabase
      .from("fragrance_oils")
      .update(dbUpdate)
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  if (notionId && isConfigured()) {
    try {
      await updateFragrancePage(notionId, body)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      return NextResponse.json(
        { error: `Supabase updated but Notion sync failed: ${message}` },
        { status: 502 }
      )
    }
  }

  return NextResponse.json({ success: true, id })
}
