/**
 * Save a personalized blend and optionally generate an AI image.
 * Used by PersonalizationFormCard in chat when user fills blend name and signature.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export const maxDuration = 60

interface PersonalizeBody {
  blendName: string
  signature?: string
  blendSummary: {
    productType: string
    fragrances: Array<{
      oilId: string
      oilName: string
      proportionPct: number
    }>
    batchWeightG?: number
    fragranceLoadPct?: number
    notes?: string
  }
  generateImage?: boolean
  promptForImage?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: PersonalizeBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const {
    blendName,
    signature,
    blendSummary,
    generateImage = false,
    promptForImage,
  } = body

  if (!blendName?.trim()) {
    return NextResponse.json(
      { error: "blendName is required" },
      { status: 400 }
    )
  }

  if (
    !blendSummary?.fragrances?.length ||
    !Array.isArray(blendSummary.fragrances)
  ) {
    return NextResponse.json(
      { error: "blendSummary.fragrances is required" },
      { status: 400 }
    )
  }

  const totalPct = blendSummary.fragrances.reduce(
    (s, f) => s + (f.proportionPct ?? 0),
    0
  )
  if (Math.abs(totalPct - 100) > 1) {
    return NextResponse.json(
      { error: "Proportions must sum to 100%" },
      { status: 400 }
    )
  }

  const effectiveBatchWeight = blendSummary.batchWeightG ?? 400
  const fragranceLoadPct = blendSummary.fragranceLoadPct ?? 10
  const notes = [blendSummary.notes, signature].filter(Boolean).join(" | ")

  const { data: blend, error: insertError } = await supabase
    .from("saved_blends")
    .insert({
      user_id: user.id,
      name: blendName.trim(),
      product_type: blendSummary.productType,
      batch_weight_g: effectiveBatchWeight,
      fragrance_load_pct: fragranceLoadPct,
      fragrances: blendSummary.fragrances,
      notes: notes || null,
    })
    .select("id")
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    )
  }

  if (!blend?.id) {
    return NextResponse.json(
      { error: "Failed to save blend" },
      { status: 500 }
    )
  }

  let publicUrl: string | null = null
  if (generateImage && (promptForImage || blendName)) {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000"
    const h = await headers()
    const cookie = h.get("cookie") ?? ""
    const fragranceNames = blendSummary.fragrances
      .map((f) => f.oilName)
      .join(", ")

    const imagePrompt =
      promptForImage ||
      `Cozy fragrance scene for a ${blendName} candle blend with notes of ${fragranceNames}. Soft ambient lighting, luxury aesthetic.`

    try {
      const res = await fetch(`${baseUrl}/api/images/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          fragranceName: blendName,
          model: "gpt-image-1.5",
          size: "1024x1024",
          quality: "high",
        }),
      })

      if (res.ok) {
        const { publicUrl: url } = await res.json()
        publicUrl = url ?? null
      }
    } catch {
      // Image generation is best-effort; blend is already saved
    }
  }

  return NextResponse.json({
    success: true,
    blendId: blend.id,
    publicUrl,
  })
}
