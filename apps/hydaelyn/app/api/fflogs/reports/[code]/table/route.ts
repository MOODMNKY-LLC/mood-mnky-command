import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchReportTable, fetchReportDetail, type TableDataType, type ViewBy } from "@/lib/fflogs/client";
import { getCached, setCached, reportTableCacheKey, reportDetailCacheKey } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
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
      { error: "FFLogs not linked. Link your FFLogs account from the dashboard." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const fightIDsParam = url.searchParams.get("fightIDs");
  const fightIDs = fightIDsParam
    ? fightIDsParam.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n))
    : [];
  const startTimeParam = url.searchParams.get("startTime");
  const endTimeParam = url.searchParams.get("endTime");
  const startTime = startTimeParam != null ? parseInt(startTimeParam, 10) : undefined;
  const endTime = endTimeParam != null ? parseInt(endTimeParam, 10) : undefined;
  const hasFightIDs = fightIDs.length > 0;
  const hasTimeRange = startTime != null && !Number.isNaN(startTime) && endTime != null && !Number.isNaN(endTime);
  if (!hasFightIDs && !hasTimeRange) {
    let reportStart: number | undefined;
    let reportEnd: number | undefined;
    const cacheKeyDetail = reportDetailCacheKey(code, "detail_meta");
    const report = await getCached<{ startTime?: number; endTime?: number }>(supabase, cacheKeyDetail);
    if (report?.startTime != null && report?.endTime != null) {
      reportStart = report.startTime;
      reportEnd = report.endTime;
    } else {
      try {
        const detail = await fetchReportDetail(tokenRow.access_token, code, { includeFights: true, expandMeta: false });
        reportStart = detail.startTime;
        reportEnd = detail.endTime;
      } catch {
        return NextResponse.json(
          { error: "You must either provide fightIDs, or provide startTime and endTime. Could not load report time range." },
          { status: 400 },
        );
      }
    }
    if (reportStart == null || reportEnd == null) {
      return NextResponse.json(
        { error: "You must either provide fightIDs, or provide startTime and endTime." },
        { status: 400 },
      );
    }
    return runTableRequest(supabase, tokenRow.access_token, code, { dataType: (url.searchParams.get("dataType") ?? "Summary") as TableDataType, viewBy: (url.searchParams.get("viewBy") ?? "Source") as ViewBy, startTime: reportStart, endTime: reportEnd });
  }

  const dataType = (url.searchParams.get("dataType") ?? "Summary") as TableDataType;
  const viewBy = (url.searchParams.get("viewBy") ?? "Source") as ViewBy;
  return runTableRequest(supabase, tokenRow.access_token, code, { fightIDs: hasFightIDs ? fightIDs : undefined, startTime: hasTimeRange ? startTime : undefined, endTime: hasTimeRange ? endTime : undefined, dataType, viewBy });
}

async function runTableRequest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accessToken: string,
  code: string,
  opts: { fightIDs?: number[]; startTime?: number; endTime?: number; dataType: TableDataType; viewBy: ViewBy },
) {
  const cacheKey = reportTableCacheKey(code, opts.fightIDs ?? [], opts.dataType, opts.viewBy);
  const cached = await getCached<{ data: unknown }>(supabase, cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  try {
    const result = await fetchReportTable(accessToken, code, {
      fightIDs: opts.fightIDs,
      startTime: opts.startTime,
      endTime: opts.endTime,
      dataType: opts.dataType,
      viewBy: opts.viewBy,
    });
    await setCached(supabase, cacheKey, "report_table", result, code);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
