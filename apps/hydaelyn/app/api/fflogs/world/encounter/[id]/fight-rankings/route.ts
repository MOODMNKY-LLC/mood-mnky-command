import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchEncounterFightRankings } from "@/lib/fflogs/client";
import { getCached, setCached, encounterFightRankingsCacheKey } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const encounterId = parseInt(id, 10);
  if (Number.isNaN(encounterId)) {
    return NextResponse.json({ error: "Invalid encounter id" }, { status: 400 });
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
  const options: { page?: number; serverRegion?: string; serverSlug?: string } = {};
  const page = url.searchParams.get("page");
  if (page != null) options.page = parseInt(page, 10) || 1;
  const serverRegion = url.searchParams.get("serverRegion");
  if (serverRegion) options.serverRegion = serverRegion;
  const serverSlug = url.searchParams.get("serverSlug");
  if (serverSlug) options.serverSlug = serverSlug;

  const cacheKey = encounterFightRankingsCacheKey(encounterId, options as Record<string, string | number | undefined>);
  const cached = await getCached<unknown>(supabase, cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchEncounterFightRankings(tokenRow.access_token, encounterId, options);
    if (result != null) await setCached(supabase, cacheKey, "encounter_fight_rankings", result, null);
    return NextResponse.json(result ?? {});
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
