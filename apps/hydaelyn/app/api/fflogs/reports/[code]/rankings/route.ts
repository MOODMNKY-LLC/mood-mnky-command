import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchReportRankings } from "@/lib/fflogs/client";
import { getCached, setCached, reportRankingsCacheKey } from "@/lib/fflogs/cache";

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
  const compare = url.searchParams.get("compare") ?? undefined;
  const timeframe = url.searchParams.get("timeframe") ?? undefined;

  const cacheKey = reportRankingsCacheKey(code, fightIDs, compare, timeframe);
  const cached = await getCached<unknown>(supabase, cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const result = await fetchReportRankings(tokenRow.access_token, code, {
      fightIDs: fightIDs.length ? fightIDs : undefined,
      compare,
      timeframe,
    });
    await setCached(supabase, cacheKey, "report_rankings", result, code);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
