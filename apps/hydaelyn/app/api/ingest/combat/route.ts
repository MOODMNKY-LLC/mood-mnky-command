import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const ingestBodySchema = z.object({
  overlay_token: z.string().min(1, "overlay_token is required"),
  encounter: z.record(z.unknown()).optional().default({}),
  combatants: z.record(z.unknown()).optional().default({}),
  zone_id: z.string().optional(),
  outcome: z.enum(["wipe", "kill"]).optional(),
  party_composition: z.unknown().optional(),
});

const RATE_LIMIT_MS = 2000;
const rateLimitMap = new Map<string, number>();

function isRateLimited(token: string): boolean {
  const now = Date.now();
  const last = rateLimitMap.get(token);
  if (last != null && now - last < RATE_LIMIT_MS) return true;
  rateLimitMap.set(token, now);
  return false;
}

export async function POST(request: Request) {
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders },
    );
  }

  const parsed = ingestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders },
    );
  }

  const { overlay_token, encounter, combatants, zone_id, outcome, party_composition } =
    parsed.data;

  if (isRateLimited(overlay_token)) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: corsHeaders },
    );
  }

  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("stream_sessions")
    .select("id, profile_id")
    .eq("overlay_token", overlay_token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Invalid overlay token" },
      { status: 401, headers: corsHeaders },
    );
  }

  const last_combat_data = {
    encounter,
    combatants,
    zone_id,
    outcome,
    party_composition: party_composition ?? undefined,
    at: new Date().toISOString(),
  };

  await supabase.from("overlay_config").upsert(
    {
      stream_session_id: session.id,
      last_combat_data,
      last_updated_at: new Date().toISOString(),
    },
    { onConflict: "stream_session_id" },
  );

  let pull_number: number | undefined;

  if (outcome) {
    const { data: maxPull } = await supabase
      .from("pulls")
      .select("pull_number")
      .eq("stream_session_id", session.id)
      .order("pull_number", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (maxPull?.pull_number ?? 0) + 1;
    const duration =
      typeof encounter.duration === "number"
        ? encounter.duration
        : typeof (encounter as Record<string, unknown>).duration === "string"
          ? parseFloat((encounter as Record<string, unknown>).duration as string)
          : null;

    await supabase.from("pulls").insert({
      stream_session_id: session.id,
      pull_number: nextNumber,
      duration_sec: duration,
      outcome,
      dps_snapshot: encounter,
      started_at: null,
      ended_at: new Date().toISOString(),
    });
    pull_number = nextNumber;
  }

  return NextResponse.json(
    { ok: true, pull_number },
    { status: 200, headers: corsHeaders },
  );
}
