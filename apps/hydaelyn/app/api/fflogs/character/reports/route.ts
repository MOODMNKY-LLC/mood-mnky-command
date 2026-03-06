import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCharacterRecentReports } from "@/lib/fflogs/client";
import { getCached, setCached, characterRecentReportsCacheKey } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
  const characterIdParam = url.searchParams.get("characterId");
  const characterId = characterIdParam ? parseInt(characterIdParam, 10) : NaN;
  if (Number.isNaN(characterId)) {
    return NextResponse.json({ error: "characterId is required" }, { status: 400 });
  }

  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "10", 10), 1), 100);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10) || 1;

  const cacheKey = characterRecentReportsCacheKey(characterId, page);
  const cached = await getCached<{ data: unknown[]; hasMorePages?: boolean }>(supabase, cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchCharacterRecentReports(tokenRow.access_token, characterId, { limit, page });
    await setCached(supabase, cacheKey, "character_recent_reports", result, null);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
