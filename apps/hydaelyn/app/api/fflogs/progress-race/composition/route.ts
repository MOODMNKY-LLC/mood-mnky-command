import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProgressRaceDetailedComposition, type ProgressRaceCompositionOptions } from "@/lib/fflogs/client";
import { getCached, setCached, progressRaceCompositionCacheKey } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

function parseCompositionOptions(url: URL): ProgressRaceCompositionOptions {
  const opts: ProgressRaceCompositionOptions = {};
  const competitionID = url.searchParams.get("competitionID");
  const guildID = url.searchParams.get("guildID");
  const guildName = url.searchParams.get("guildName") ?? undefined;
  const serverSlug = url.searchParams.get("serverSlug") ?? undefined;
  const serverRegion = url.searchParams.get("serverRegion") ?? undefined;
  const encounterID = url.searchParams.get("encounterID");
  const difficulty = url.searchParams.get("difficulty");
  const size = url.searchParams.get("size");
  if (competitionID != null) opts.competitionID = parseInt(competitionID, 10);
  if (guildID != null) opts.guildID = parseInt(guildID, 10);
  if (guildName) opts.guildName = guildName;
  if (serverSlug) opts.serverSlug = serverSlug;
  if (serverRegion) opts.serverRegion = serverRegion;
  if (encounterID != null) opts.encounterID = parseInt(encounterID, 10);
  if (difficulty != null) opts.difficulty = parseInt(difficulty, 10);
  if (size != null) opts.size = parseInt(size, 10);
  return opts;
}

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

  const options = parseCompositionOptions(request.nextUrl);
  const cacheKey = progressRaceCompositionCacheKey(options as Record<string, string | number | undefined>);
  const cached = await getCached<unknown>(supabase, cacheKey, { ttlMinutes: 1 });
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchProgressRaceDetailedComposition(tokenRow.access_token, options);
    if (result != null) await setCached(supabase, cacheKey, "progress_race_composition", result, null);
    return NextResponse.json(result ?? {});
  } catch {
    return NextResponse.json({});
  }
}
