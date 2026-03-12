import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProgressRaceData, fetchProgressRace, type ProgressRaceOptions } from "@/lib/fflogs/client";
import { getCached, setCached, progressRaceCacheKey } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

function parseProgressRaceOptions(url: URL): ProgressRaceOptions | undefined {
  const serverRegion = url.searchParams.get("serverRegion") ?? undefined;
  const serverSubregion = url.searchParams.get("serverSubregion") ?? undefined;
  const serverSlug = url.searchParams.get("serverSlug") ?? undefined;
  const zoneID = url.searchParams.get("zoneID");
  const competitionID = url.searchParams.get("competitionID");
  const difficulty = url.searchParams.get("difficulty");
  const size = url.searchParams.get("size");
  const guildID = url.searchParams.get("guildID");
  const guildName = url.searchParams.get("guildName") ?? undefined;
  if (
    serverRegion == null &&
    serverSubregion == null &&
    serverSlug == null &&
    zoneID == null &&
    competitionID == null &&
    difficulty == null &&
    size == null &&
    guildID == null &&
    guildName == null
  ) {
    return undefined;
  }
  const opts: ProgressRaceOptions = {};
  if (serverRegion) opts.serverRegion = serverRegion;
  if (serverSubregion) opts.serverSubregion = serverSubregion;
  if (serverSlug) opts.serverSlug = serverSlug;
  if (zoneID != null) opts.zoneID = parseInt(zoneID, 10);
  if (competitionID != null) opts.competitionID = parseInt(competitionID, 10);
  if (difficulty != null) opts.difficulty = parseInt(difficulty, 10);
  if (size != null) opts.size = parseInt(size, 10);
  if (guildID != null) opts.guildID = parseInt(guildID, 10);
  if (guildName) opts.guildName = guildName;
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

  const options = parseProgressRaceOptions(request.nextUrl);
  const cacheKey = progressRaceCacheKey(options as Record<string, string | number | undefined>);
  const cached = await getCached<unknown>(supabase, cacheKey, { ttlMinutes: 1 });
  if (cached) return NextResponse.json(cached);

  try {
    const result = options
      ? await fetchProgressRace(tokenRow.access_token, options)
      : await fetchProgressRaceData(tokenRow.access_token);
    if (result != null) await setCached(supabase, cacheKey, "progress_race", result, null);
    return NextResponse.json(result ?? {});
  } catch {
    return NextResponse.json({});
  }
}

