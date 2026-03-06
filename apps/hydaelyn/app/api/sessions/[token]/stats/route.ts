import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("stream_sessions")
    .select("id, name")
    .eq("overlay_token", token)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json(
      { error: "Database error", found: false },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json({
      found: false,
      pull_count: 0,
      best_pull_duration_sec: null,
      best_pull_dps: null,
      last_encounter_title: null,
      last_encounter_duration: null,
      last_encounter_dps: null,
      session_name: null,
    });
  }

  const { data: pulls } = await supabase
    .from("pulls")
    .select("pull_number, duration_sec, outcome, dps_snapshot")
    .eq("stream_session_id", session.id)
    .order("pull_number", { ascending: false });

  const pull_count = pulls?.length ?? 0;
  const bestPull = pulls?.reduce(
    (best, p) => {
      const dur = p.duration_sec != null ? Number(p.duration_sec) : 0;
      const dps =
        p.dps_snapshot &&
        typeof p.dps_snapshot === "object" &&
        "ENCDPS" in p.dps_snapshot
          ? Number((p.dps_snapshot as { ENCDPS?: unknown }).ENCDPS) || 0
          : 0;
      if (dur > (best.duration_sec ?? 0)) return { ...p, duration_sec: dur, dps };
      if (dur === (best.duration_sec ?? 0) && dps > (best.dps ?? 0))
        return { ...p, duration_sec: dur, dps };
      return best;
    },
    {} as { duration_sec?: number; dps?: number },
  );

  const { data: config } = await supabase
    .from("overlay_config")
    .select("last_combat_data, last_updated_at")
    .eq("stream_session_id", session.id)
    .single();

  const last = (config?.last_combat_data as { encounter?: Record<string, unknown> } | null)
    ?.encounter;

  return NextResponse.json({
    found: true,
    pull_count,
    best_pull_duration_sec: bestPull?.duration_sec ?? null,
    best_pull_dps: bestPull?.dps ?? null,
    last_encounter_title: last && "title" in last ? last.title : null,
    last_encounter_duration:
      last && "duration" in last ? Number(last.duration) ?? null : null,
    last_encounter_dps:
      last && "ENCDPS" in last ? Number(last.ENCDPS) ?? null : null,
    session_name: session.name,
  });
}
