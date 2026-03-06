/**
 * Build FightContext and ReportContext from normalized fflogs_* tables for OpenAI and Discord.
 * Used by report insights and Discord report posting.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type FightContextPlayer = {
  name: string | null;
  job: string | null;
  rdps: number | null;
  adps: number | null;
  hps: number | null;
  deaths: number | null;
  damage_taken: number | null;
};

export type FightContext = {
  fight_id: string;
  name: string | null;
  kill: boolean | null;
  duration_ms: number | null;
  party_dps: number | null;
  party_hps: number | null;
  deaths: number | null;
  damage_taken: number | null;
  players: FightContextPlayer[];
};

export type ReportContext = {
  report_code: string;
  title: string | null;
  fights: FightContext[];
};

/**
 * Build FightContext for a single fight (from fflogs_fights + fflogs_fight_summaries + fflogs_player_fight_metrics).
 */
export async function buildFightContext(
  supabase: SupabaseClient,
  fightId: string,
): Promise<FightContext | null> {
  const { data: fight, error: fightError } = await supabase
    .from("fflogs_fights")
    .select("id, name, kill, duration_ms")
    .eq("id", fightId)
    .single();

  if (fightError || !fight) return null;

  const { data: summary } = await supabase
    .from("fflogs_fight_summaries")
    .select("party_dps, party_hps, deaths, damage_taken")
    .eq("fight_id", fightId)
    .maybeSingle();

  const { data: metrics } = await supabase
    .from("fflogs_player_fight_metrics")
    .select("actor_name, job, rdps, adps, hps, deaths, damage_taken")
    .eq("fight_id", fightId)
    .order("rdps", { ascending: false, nullsFirst: false });

  const players: FightContextPlayer[] = (metrics ?? []).map((m) => ({
    name: (m.actor_name as string) ?? null,
    job: (m.job as string) ?? null,
    rdps: (m.rdps as number) ?? null,
    adps: (m.adps as number) ?? null,
    hps: (m.hps as number) ?? null,
    deaths: (m.deaths as number) ?? null,
    damage_taken: (m.damage_taken as number) ?? null,
  }));

  return {
    fight_id: fight.id as string,
    name: (fight.name as string) ?? null,
    kill: (fight.kill as boolean) ?? null,
    duration_ms: (fight.duration_ms as number) ?? null,
    party_dps: (summary?.party_dps as number) ?? null,
    party_hps: (summary?.party_hps as number) ?? null,
    deaths: (summary?.deaths as number) ?? null,
    damage_taken: (summary?.damage_taken as number) ?? null,
    players,
  };
}

/**
 * Build ReportContext for a report: load from fflogs_reports (by code + profile_id), then all fights and their contexts.
 */
export async function buildReportContext(
  supabase: SupabaseClient,
  reportCode: string,
  profileId: string,
): Promise<ReportContext | null> {
  const { data: report, error: reportError } = await supabase
    .from("fflogs_reports")
    .select("id, code, title")
    .eq("profile_id", profileId)
    .eq("code", reportCode)
    .single();

  if (reportError || !report) return null;

  const { data: fights, error: fightsError } = await supabase
    .from("fflogs_fights")
    .select("id")
    .eq("report_id", report.id)
    .order("start_time_ms", { ascending: true });

  if (fightsError || !fights?.length) {
    return { report_code: reportCode, title: (report.title as string) ?? null, fights: [] };
  }

  const fightContexts: FightContext[] = [];
  for (const f of fights) {
    const ctx = await buildFightContext(supabase, f.id as string);
    if (ctx) fightContexts.push(ctx);
  }

  return {
    report_code: reportCode,
    title: (report.title as string) ?? null,
    fights: fightContexts,
  };
}

/**
 * Serialize ReportContext to a string for use in OpenAI prompts.
 */
export function serializeReportContextForPrompt(ctx: ReportContext): string {
  const lines: string[] = [
    `Report: ${ctx.report_code}${ctx.title ? ` — ${ctx.title}` : ""}`,
    `Fights: ${ctx.fights.length}`,
  ];
  for (let i = 0; i < ctx.fights.length; i++) {
    const f = ctx.fights[i];
    const killStr = f.kill == null ? "?" : f.kill ? "Kill" : "Wipe";
    const durStr = f.duration_ms != null ? `${(f.duration_ms / 1000).toFixed(1)}s` : "?";
    lines.push(`  Fight ${i + 1}: ${f.name ?? "Unknown"} (${killStr}, ${durStr})`);
    if (f.party_dps != null) lines.push(`    Party DPS: ${f.party_dps.toFixed(0)}`);
    if (f.party_hps != null) lines.push(`    Party HPS: ${f.party_hps.toFixed(0)}`);
    if (f.deaths != null && f.deaths > 0) lines.push(`    Deaths: ${f.deaths}`);
    if (f.players.length) {
      lines.push("    Players:");
      for (const p of f.players) {
        const rdps = p.rdps != null ? p.rdps.toFixed(0) : "?";
        const hps = p.hps != null ? p.hps.toFixed(0) : "?";
        lines.push(`      - ${p.name ?? "?"} (${p.job ?? "?"}): rdps ${rdps}, hps ${hps}${p.deaths ? `, deaths ${p.deaths}` : ""}`);
      }
    }
  }
  return lines.join("\n");
}
