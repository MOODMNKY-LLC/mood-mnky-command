import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchReportEvents } from "@/lib/fflogs/client";
import { getCached, setCached, reportEventsCacheKey } from "@/lib/fflogs/cache";

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
  const limit = Math.min(10000, Math.max(100, parseInt(url.searchParams.get("limit") ?? "300", 10)));
  const startTime = url.searchParams.get("startTime") ? parseFloat(url.searchParams.get("startTime")!) : undefined;
  const endTime = url.searchParams.get("endTime") ? parseFloat(url.searchParams.get("endTime")!) : undefined;

  const cacheKey = reportEventsCacheKey(code, fightIDs, limit, startTime);
  const cached = await getCached<{ data: unknown[]; nextPageTimestamp?: number }>(supabase, cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const result = await fetchReportEvents(tokenRow.access_token, code, {
      fightIDs: fightIDs.length ? fightIDs : undefined,
      limit,
      startTime,
      endTime,
    });
    await setCached(supabase, cacheKey, "report_events", result, code);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
