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

    // Option A: also write to ODBC-shaped tables so the ACT dashboard shows overlay ingest data.
    const enc = encounter as Record<string, unknown>;
    const encidRes = await supabase.rpc("get_next_overlay_encid");
    const encid = encidRes.data as number | null;
    if (encid != null) {
      const num = (v: unknown): number | null =>
        typeof v === "number" && !Number.isNaN(v) ? v : typeof v === "string" ? parseFloat(v) ?? null : null;
      const endedAt = new Date();
      const durationSec = duration ?? num(enc.duration) ?? 0;
      const startTime = durationSec > 0 ? new Date(endedAt.getTime() - durationSec * 1000) : endedAt;

      await supabase.from("encounter_table").insert({
        encid,
        title: (enc.title as string) ?? (enc.Title as string) ?? `Session ${session.id.slice(0, 8)} #${nextNumber}`,
        starttime: startTime.toISOString().slice(0, 19).replace("T", " "),
        endtime: endedAt.toISOString().slice(0, 19).replace("T", " "),
        duration: durationSec,
        damage: num(enc.damage) ?? (enc.Damage != null ? num(enc.Damage) : null),
        encdps: num(enc.ENCDPS) ?? num(enc.EncDPS) ?? null,
        zone: (enc.zone as string) ?? (enc.Zone as string) ?? null,
        kills: enc.kills != null ? num(enc.kills) : null,
        deaths: enc.deaths != null ? num(enc.deaths) : null,
      });

      const combatantEntries = Object.entries(combatants).filter(
        ([name]) => name && !name.startsWith(" ")
      ) as [string, Record<string, unknown>][];
      if (combatantEntries.length > 0) {
        const starttimeStr = startTime.toISOString().slice(0, 19).replace("T", " ");
        await supabase.from("combatant_table").insert(
          combatantEntries.map(([name, row]) => ({
            encid,
            name,
            job: (row.Job as string) ?? (row.job as string) ?? null,
            dps: num(row.ENCDPS) ?? num(row.EncDPS) ?? null,
            encdps: num(row.ENCDPS) ?? num(row.EncDPS) ?? null,
            damage: num(row.damage) ?? num(row.Damage) ?? null,
            starttime: starttimeStr,
          }))
        );
      }
    }
  }

  return NextResponse.json(
    { ok: true, pull_number },
    { status: 200, headers: corsHeaders },
  );
}
