import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/openai";

export const dynamic = "force-dynamic";

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
      { status: 503 },
    );
  }

  let body: { encid?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const encid = body.encid?.trim();
  if (!encid) {
    return NextResponse.json({ error: "encid is required" }, { status: 400 });
  }

  const schema = supabase.schema("hydaelyn");
  const [encRes, combatRes] = await Promise.all([
    schema.from("encounter_table").select("*").eq("encid", encid).maybeSingle(),
    schema.from("combatant_table").select("name, job, dps, damage").eq("encid", encid).order("damage", { ascending: false }).limit(20),
  ]);

  const encounter = encRes.data;
  const combatants = combatRes.data ?? [];

  const systemPrompt = `You are a helpful FFXIV raid analyst. Given encounter and combatant data from ACT/ODBC, provide a brief strategic insight: what went well, what to improve, and one concrete tip. Keep the response under 150 words.`;
  const userPrompt = encounter
    ? `Encounter: ${encounter.title ?? encid}, zone: ${encounter.zone ?? "unknown"}, duration: ${encounter.duration ?? 0}s, total damage: ${encounter.damage ?? 0}, DPS: ${encounter.encdps ?? 0}. Top combatants: ${combatants.map((c) => `${c.name} (${c.job}): ${c.damage} dmg`).join("; ")}.`
    : `Encounter ID: ${encid}. No encounter or combatant data found. Suggest checking ACT ODBC export or overlay ingest.`;

  try {
    const text = await chatCompletion(systemPrompt, userPrompt, { maxTokens: 300 });
    return NextResponse.json({ text, encid });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate insight";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
