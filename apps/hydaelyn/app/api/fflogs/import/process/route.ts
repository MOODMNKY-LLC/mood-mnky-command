import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchReportTable } from "@/lib/fflogs/client";
import { parseReportTableSummary } from "@/lib/fflogs/parse-table";
import { buildReportContext } from "@/lib/fflogs/fight-context";
import { getReportSubscriptions, postReportToWebhook } from "@/lib/discord/post-raid-report";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const processBodySchema = z.object({
  jobId: z.string().uuid().optional(),
});

/**
 * POST /api/fflogs/import/process
 * Body: { jobId?: string } — if omitted, processes the next queued job for the current user.
 * For the job: fetch table (Summary) per fight, parse, UPSERT fflogs_fight_summaries and fflogs_player_fight_metrics, set job done/failed.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tokenRow } = await supabase
    .from("user_fflogs_tokens")
    .select("access_token")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!tokenRow?.access_token) {
    return NextResponse.json(
      { error: "FFLogs not linked" },
      { status: 403 },
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body ok
  }
  const parsed = processBodySchema.safeParse(body);
  const jobId = parsed.success ? parsed.data.jobId : undefined;

  let job: { id: string; report_code: string; status: string; fight_ids: unknown } | null = null;

  if (jobId) {
    const { data, error } = await supabase
      .from("fflogs_import_jobs")
      .select("id, report_code, status, fight_ids")
      .eq("id", jobId)
      .eq("profile_id", user.id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 });
    }
    job = data as { id: string; report_code: string; status: string; fight_ids: unknown };
  } else {
    const { data, error } = await supabase
      .from("fflogs_import_jobs")
      .select("id, report_code, status, fight_ids")
      .eq("profile_id", user.id)
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ processed: false, message: "No queued job found" });
    }
    job = data as { id: string; report_code: string; status: string; fight_ids: unknown };
  }

  if (job.status !== "queued") {
    return NextResponse.json(
      { processed: false, message: `Job status is ${job.status}` },
    );
  }

  const fightIds = Array.isArray(job.fight_ids) ? (job.fight_ids as number[]) : [];
  const reportCode = job.report_code;

  await supabase
    .from("fflogs_import_jobs")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", job.id);

  const { data: reportRow } = await supabase
    .from("fflogs_reports")
    .select("id")
    .eq("profile_id", user.id)
    .eq("code", reportCode)
    .single();

  if (!reportRow) {
    await supabase
      .from("fflogs_import_jobs")
      .update({
        status: "failed",
        last_error: "Report not found",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return NextResponse.json({ processed: true, status: "failed", error: "Report not found" });
  }

  const reportId = reportRow.id as string;

  const { data: fightRows } = await supabase
    .from("fflogs_fights")
    .select("id, fight_id")
    .eq("report_id", reportId)
    .in("fight_id", fightIds);

  const fightIdToUuid = new Map<number, string>();
  for (const r of fightRows ?? []) {
    fightIdToUuid.set(r.fight_id as number, r.id as string);
  }

  let lastError: string | null = null;

  for (const fflogsFightId of fightIds) {
    const fightUuid = fightIdToUuid.get(fflogsFightId);
    if (!fightUuid) continue;

    try {
      const tableResult = await fetchReportTable(tokenRow.access_token, reportCode, {
        fightIDs: [fflogsFightId],
        dataType: "Summary",
        viewBy: "Source",
      });

      const summary = parseReportTableSummary(tableResult);

      await supabase.from("fflogs_fight_summaries").upsert(
        {
          fight_id: fightUuid,
          party_dps: summary.party_dps,
          party_hps: summary.party_hps,
          deaths: summary.deaths,
          damage_taken: summary.damage_taken,
          summary: {
            party_dps: summary.party_dps,
            party_hps: summary.party_hps,
            deaths: summary.deaths,
            damage_taken: summary.damage_taken,
            players: summary.players,
          },
          computed_at: new Date().toISOString(),
        },
        { onConflict: "fight_id" },
      );

      for (const p of summary.players) {
        await supabase.from("fflogs_player_fight_metrics").upsert(
          {
            fight_id: fightUuid,
            actor_id: p.actor_id,
            actor_name: p.actor_name,
            job: p.job,
            rdps: p.rdps,
            adps: p.adps,
            ndps: p.ndps,
            hps: p.hps,
            deaths: p.deaths,
            damage_taken: p.damage_taken,
            perf: {},
            computed_at: new Date().toISOString(),
          },
          { onConflict: "fight_id,actor_id" },
        );
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Process fight failed";
    }
  }

  const finalStatus = lastError ? "failed" : "done";
  await supabase
    .from("fflogs_import_jobs")
    .update({
      status: finalStatus,
      last_error: lastError,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (finalStatus === "done") {
    try {
      const reportCtx = await buildReportContext(supabase, reportCode, user.id);
      if (reportCtx && reportCtx.fights.length > 0) {
        const subs = await getReportSubscriptions(supabase, user.id, reportCode);
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ??
          process.env.VERCEL_URL != null
            ? `https://${process.env.VERCEL_URL}`
            : "https://hydaelyn.example.com";
        for (const sub of subs) {
          if (sub.webhook_url) {
            await postReportToWebhook(sub.webhook_url, reportCode, reportCtx, baseUrl);
          }
        }
      }
    } catch {
      // Discord post is best-effort; do not fail the response
    }
  }

  return NextResponse.json({
    processed: true,
    status: finalStatus,
    jobId: job.id,
    report_code: reportCode,
    fights_processed: fightIds.length,
    error: lastError ?? undefined,
  });
}
