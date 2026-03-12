/**
 * POST /api/dojo/blends/describe
 * Generates an AI description of a fragrance blend using structured output.
 * Enriches with glossary (fragrance_notes) for granular olfactive info,
 * then analyzes blend composition in five steps for a near real-world accurate summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { noteToSlug } from "@/lib/fragrance-search";

export const maxDuration = 45;

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

const describeSchema = z.object({
  summary: z
    .string()
    .describe(
      "2-4 sentence evocative description of how the blend smells, considering proportions and note layering"
    ),
  suggestedName: z
    .string()
    .describe(
      "A creative, memorable name for the blend (2-4 words, no quotes)"
    ),
});

async function fetchGlossaryForNotes(
  noteNames: string[]
): Promise<
  Map<string, { descriptionShort: string; olfactiveProfile: string; facts: string }>
> {
  const slugs = [
    ...new Set(noteNames.map((n) => noteToSlug(n)).filter(Boolean)),
  ];
  if (slugs.length === 0) return new Map();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fragrance_notes")
    .select("name, slug, description_short, olfactive_profile, facts")
    .in("slug", slugs);

  if (error || !data) return new Map();
  const map = new Map<
    string,
    { descriptionShort: string; olfactiveProfile: string; facts: string }
  >();
  for (const row of data) {
    map.set(row.slug, {
      descriptionShort: row.description_short ?? "",
      olfactiveProfile: row.olfactive_profile ?? "",
      facts: row.facts ?? "",
    });
  }
  return map;
}

const SYSTEM_PROMPT = `You are an expert fragrance blender and sensory analyst for a candle/soap/lotion craft business.

Your task is to produce a near real-world accurate description of a fragrance blend using a five-step analytical process:

1. **Extract & organize**: Review the blend composition—each oil, its proportion (%), and its top/middle/base notes. Understand which notes dominate vs support based on percentage.

2. **Glossary enrichment**: Use the provided GLOSSARY section for each note. Each note has:
   - description_short: Brief sensory description
   - olfactive_profile: How it smells (sweet, dry, warm, sharp, etc.)
   - facts: Olfactive facts (volatility, longevity, blending characteristics)
   Use this granular olfactive information to inform your analysis.

3. **Proportion analysis**: Consider how percentages affect the blend. A 50% oil will dominate; 10% oils add nuance. Top notes evaporate first; base notes last. Middle notes bridge the heart of the scent.

4. **Olfactive synthesis**: Imagine smelling the blend over time (dry-down). How do the notes combine? What is the first impression? The heart? The lasting character? Seasonal or mood associations?

5. **Refine**: Produce a 2–4 sentence description that is evocative, accurate, and accessible. Avoid jargon unless it adds clarity. Focus on the sensory experience. Also suggest a creative 2–4 word name for the blend.

Write in a warm, accessible tone. Be specific about scent character, not generic.`;

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

  const allNoteNames = oils.flatMap(
    (o) => [
      ...(o.topNotes ?? []),
      ...(o.middleNotes ?? []),
      ...(o.baseNotes ?? []),
    ]
  );
  const glossary = await fetchGlossaryForNotes(allNoteNames);

  const blendSection = oils
    .map(
      (o) =>
        `- ${o.oilName} (${o.proportionPct}%): ` +
        `top: ${(o.topNotes ?? []).join(", ") || "n/a"}; ` +
        `mid: ${(o.middleNotes ?? []).join(", ") || "n/a"}; ` +
        `base: ${(o.baseNotes ?? []).join(", ") || "n/a"}`
    )
    .join("\n");

  const seenNotes = new Set<string>();
  const glossaryEntries: string[] = [];
  for (const noteName of allNoteNames) {
    if (seenNotes.has(noteName)) continue;
    seenNotes.add(noteName);
    const slug = noteToSlug(noteName);
    const data = slug ? glossary.get(slug) : undefined;
    if (!data) continue;
    const parts = [
      `**${noteName}**:`,
      data.descriptionShort && `  Description: ${data.descriptionShort}`,
      data.olfactiveProfile && `  Profile: ${data.olfactiveProfile}`,
      data.facts && `  Facts: ${data.facts}`,
    ].filter(Boolean);
    glossaryEntries.push(parts.join("\n"));
  }

  const glossarySection =
    glossaryEntries.length > 0
      ? `\n\n## GLOSSARY (use for olfactive detail)\n\n${glossaryEntries.join("\n\n")}`
      : "";

  const prompt = `## BLEND COMPOSITION\n\n${blendSection}${glossarySection}\n\nAnalyze this blend using the five-step process and produce a refined summary and suggested name.`;

  try {
    const { output } = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt,
      output: Output.object({
        schema: describeSchema,
      }),
    });

    return NextResponse.json({
      summary: output.summary ?? "",
      suggestedName: output.suggestedName ?? "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
