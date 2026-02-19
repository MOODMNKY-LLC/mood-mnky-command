/**
 * POST /api/dojo/blends/describe
 * Generates an AI description of a fragrance blend from oils and proportions.
 * Uses reasoning model for quality output.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 30;

interface OilInput {
  oilId: string;
  oilName: string;
  proportionPct: number;
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
}

interface DescribeBody {
  oils: OilInput[];
}

const SYSTEM_PROMPT = `You are an expert fragrance blender and sensory analyst for a candle/soap/lotion craft business.

Given a list of fragrance oils with their proportions and note placements (top, middle, base), write a concise, evocative 2–4 sentence description of what the resulting blend would smell like.

Consider:
- How the proportions affect the balance (dominant vs supporting notes)
- How top notes create the first impression, middle notes the heart, base notes the lasting character
- Seasonal or mood associations
- Complexity and layering effects

Write in a warm, accessible tone. Avoid jargon unless it adds clarity. Focus on the sensory experience.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }

  let body: DescribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { oils } = body;
  if (!oils?.length || !Array.isArray(oils)) {
    return NextResponse.json(
      { error: "oils array is required" },
      { status: 400 }
    );
  }

  const totalPct = oils.reduce((s, o) => s + (o.proportionPct ?? 0), 0);
  if (Math.abs(totalPct - 100) > 1) {
    return NextResponse.json(
      { error: "Proportions must sum to 100%" },
      { status: 400 }
    );
  }

  const prompt = oils
    .map(
      (o) =>
        `- ${o.oilName} (${o.proportionPct}%): ` +
        `top notes: ${(o.topNotes ?? []).join(", ") || "n/a"}; ` +
        `middle: ${(o.middleNotes ?? []).join(", ") || "n/a"}; ` +
        `base: ${(o.baseNotes ?? []).join(", ") || "n/a"}`
    )
    .join("\n");

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      prompt: `Describe this fragrance blend:\n\n${prompt}`,
    });

    return NextResponse.json({ summary: text ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
