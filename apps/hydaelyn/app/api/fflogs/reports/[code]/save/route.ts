import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchReportDetail,
  fetchReportTable,
  fetchReportEvents,
} from "@/lib/fflogs/client";
import {
  getCached,
  setCached,
  reportDetailCacheKey,
  reportTableCacheKey,
  reportEventsCacheKey,
} from "@/lib/fflogs/cache";
import type { FFLogsReportDetail } from "@/lib/fflogs/client";

export const dynamic = "force-dynamic";

/**
 * Ensures report detail, table (first fight), and a small events slice are fetched and stored
 * in fflogs_response_cache so the report is available for offline/analytics.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = rawCode?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ error: "Missing report code" }, { status: 400 });
  }

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

  const result = { saved: true, detail: false, table: false, events: false };

  try {
    const cacheKeyDetail = reportDetailCacheKey(code, "detail_meta");
    let report: FFLogsReportDetail | null = (await getCached<FFLogsReportDetail>(
      supabase,
      cacheKeyDetail,
    )) as FFLogsReportDetail | null;

    if (!report) {
      report = await fetchReportDetail(tokenRow.access_token, code, {
        includeFights: true,
        expandMeta: true,
      });
      await setCached(supabase, cacheKeyDetail, "report_detail", report, code);
      result.detail = true;
    }

    const fightIds = report?.fights?.length
      ? [report.fights[0].id]
      : [];

    if (fightIds.length > 0) {
      const tableKey = reportTableCacheKey(code, fightIds, "Summary", "Source");
      if (!(await getCached(supabase, tableKey))) {
        const table = await fetchReportTable(tokenRow.access_token, code, {
          fightIDs: fightIds,
          dataType: "Summary",
          viewBy: "Source",
        });
        await setCached(supabase, tableKey, "report_table", table, code);
        result.table = true;
      }

      const eventsKey = reportEventsCacheKey(code, fightIds, 100, 0);
      if (!(await getCached(supabase, eventsKey))) {
        const events = await fetchReportEvents(tokenRow.access_token, code, {
          fightIDs: fightIds,
          limit: 100,
        });
        await setCached(supabase, eventsKey, "report_events", events, code);
        result.events = true;
      }
    }

    // Verify: re-read report detail from cache to confirm it was written
    const verified = !!(await getCached<unknown>(supabase, cacheKeyDetail));
    return NextResponse.json({ ...result, verified });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: message, saved: false, verified: false }, { status: 502 });
  }
}
