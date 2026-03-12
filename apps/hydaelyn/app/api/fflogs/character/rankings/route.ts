import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCharacterZoneRankings } from "@/lib/fflogs/client";
import { getCached, setCached, characterZoneRankingsCacheKey } from "@/lib/fflogs/cache";

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
  const zoneIdParam = url.searchParams.get("zoneID");
  const characterId = characterIdParam ? parseInt(characterIdParam, 10) : NaN;
  const zoneId = zoneIdParam ? parseInt(zoneIdParam, 10) : NaN;
  if (Number.isNaN(characterId) || Number.isNaN(zoneId)) {
    return NextResponse.json({ error: "characterId and zoneID are required" }, { status: 400 });
  }

  const options: { metric?: string; partition?: number; size?: number } = {};
  const metric = url.searchParams.get("metric");
  const partition = url.searchParams.get("partition");
  const size = url.searchParams.get("size");
  if (metric) options.metric = metric;
  if (partition != null) options.partition = parseInt(partition, 10);
  if (size != null) options.size = parseInt(size, 10);

  const cacheKey = characterZoneRankingsCacheKey(characterId, zoneId, options as Record<string, string | number | undefined>);
  const cached = await getCached<unknown>(supabase, cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchCharacterZoneRankings(tokenRow.access_token, characterId, zoneId, options);
    if (result != null) await setCached(supabase, cacheKey, "character_zone_rankings", result, null);
    return NextResponse.json(result ?? {});
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
