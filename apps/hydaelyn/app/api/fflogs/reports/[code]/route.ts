import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchReportDetail } from "@/lib/fflogs/client";
import { getCached, setCached, reportDetailCacheKey } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
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
      { error: "FFLogs not linked. Link your FFLogs account from the dashboard." },
      { status: 403 },
    );
  }

  const expand = request.nextUrl.searchParams.get("expand") === "meta";
  const cacheKey = reportDetailCacheKey(code, expand ? "detail_meta" : "detail");
  const cached = await getCached<unknown>(supabase, cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const report = await fetchReportDetail(tokenRow.access_token, code, {
      includeFights: true,
      expandMeta: expand,
    });
    await setCached(supabase, cacheKey, "report_detail", report, code);
    return NextResponse.json(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
