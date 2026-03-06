import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchReportDetail } from "@/lib/fflogs/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const importBodySchema = z.object({
  reportCodes: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * POST /api/fflogs/import
 * Body: { reportCodes: string[] }
 * For each code: fetch report + fights from FFLogs v2, UPSERT fflogs_reports and fflogs_fights,
 * then enqueue fflogs_import_jobs (status queued, fight_ids). Returns created/updated jobs.
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
      { error: "FFLogs not linked. Link your FFLogs account from the dashboard." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = importBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { reportCodes } = parsed.data;
  const profileId = user.id;
  const jobs: { id: string; report_code: string; status: string; fight_ids: number[] }[] = [];

  for (const code of reportCodes) {
    try {
      const report = await fetchReportDetail(tokenRow.access_token, code, {
        includeFights: true,
        expandMeta: true,
      });

      const regionSlug = (report.region as { slug?: string; name?: string } | null)?.slug ?? report.region?.name ?? null;
      const zoneId = report.zone?.id ?? null;
      const startTimeMs = report.startTime != null ? report.startTime : null;
      const endTimeMs = report.endTime != null ? report.endTime : null;

      const { data: reportRow, error: reportError } = await supabase
        .from("fflogs_reports")
        .upsert(
          {
            profile_id: profileId,
            code,
            title: report.title ?? null,
            region: regionSlug ?? null,
            zone_id: zoneId,
            start_time_ms: startTimeMs,
            end_time_ms: endTimeMs,
            fetched_at: new Date().toISOString(),
            raw: report as unknown as Record<string, unknown>,
          },
          { onConflict: "profile_id,code", ignoreDuplicates: false },
        )
        .select("id")
        .single();

      if (reportError || !reportRow) {
        jobs.push({
          id: "",
          report_code: code,
          status: "failed",
          fight_ids: [],
        });
        continue;
      }

      const reportId = reportRow.id as string;
      const fights = report.fights ?? [];
      const fightIds: number[] = [];

      for (const f of fights) {
        const durationMs =
          f.endTime != null && f.startTime != null ? f.endTime - f.startTime : null;
        const { error: fightError } = await supabase.from("fflogs_fights").upsert(
          {
            report_id: reportId,
            fight_id: f.id,
            encounter_id: f.encounterID ?? null,
            name: f.name ?? null,
            kill: f.kill ?? null,
            start_time_ms: f.startTime ?? null,
            end_time_ms: f.endTime ?? null,
            duration_ms: durationMs,
            raw: f as unknown as Record<string, unknown>,
          },
          { onConflict: "report_id,fight_id", ignoreDuplicates: false },
        );
        if (!fightError) {
          fightIds.push(f.id);
        }
      }

      const { data: jobRow, error: jobError } = await supabase
        .from("fflogs_import_jobs")
        .insert({
          profile_id: profileId,
          report_code: code,
          status: "queued",
          fight_ids: fightIds,
          updated_at: new Date().toISOString(),
        })
        .select("id, report_code, status, fight_ids")
        .single();

      if (!jobError && jobRow) {
        jobs.push({
          id: jobRow.id as string,
          report_code: jobRow.report_code as string,
          status: (jobRow.status as string) ?? "queued",
          fight_ids: Array.isArray(jobRow.fight_ids) ? (jobRow.fight_ids as number[]) : [],
        });
      } else {
        jobs.push({ id: "", report_code: code, status: "failed", fight_ids: [] });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Import failed";
      jobs.push({ id: "", report_code: code, status: "failed", fight_ids: [] });
    }
  }

  return NextResponse.json({ jobs });
}
