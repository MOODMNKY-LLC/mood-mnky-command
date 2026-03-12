/**
 * AI-assisted form question suggestions.
 * Uses OpenAI with structured output to generate form schema from a prompt.
 */

import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"
import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const questionSchema = z.object({
  type: z.enum([
    "text",
    "textarea",
    "dropdown",
    "radio",
    "checkbox",
    "header",
  ]),
  text: z.string(),
  order: z.number(),
  name: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  semanticKey: z
    .enum([
      "target_mood",
      "product_type",
      "experience_level",
      "preferred_notes",
      "blend_style",
      "fragrance_hints",
    ])
    .optional(),
})

const responseSchema = z.object({
  questions: z.array(questionSchema),
})

const SYSTEM_PROMPT = `You are an expert at designing fragrance intake forms for a candle/soap/lotion crafting business.

Generate form questions based on the user's description. Use these semantic keys when appropriate:
- target_mood: What mood or feeling the customer wants (e.g. relaxing, energizing)
- product_type: Candle, soap, lotion, room spray, wax melt, perfume
- experience_level: Beginner, intermediate, advanced
- preferred_notes: Top/middle/base note preferences
- blend_style: Simple single-note vs complex blend
- fragrance_hints: Free-text description of scent preferences (citrus, vanilla, woods, etc.)

Use clear, friendly question text. For dropdown/radio, provide sensible options.
Order questions logically: start with product type and experience, then mood and preferences, then open-ended fragrance hints.`

export async function POST(request: NextRequest) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    )
  }

  let body: { prompt: string; funnelType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { prompt } = body
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 }
    )
  }

  try {
    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      prompt: `Generate form questions for: ${prompt}`,
      output: Output.object({
        schema: responseSchema,
      }),
    })

    return NextResponse.json({ questions: output.questions })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
