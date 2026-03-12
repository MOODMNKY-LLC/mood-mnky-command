import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchServersByRegion } from "@/lib/fflogs/client";
import { getCached, setCached, serversByRegionCacheKey } from "@/lib/fflogs/cache";
import { WORLD_GAME_TTL } from "@/lib/fflogs/cache";

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
  const regionIdParam = url.searchParams.get("regionId");
  const regionId = regionIdParam ? parseInt(regionIdParam, 10) : undefined;
  if (regionId == null || Number.isNaN(regionId)) {
    return NextResponse.json({ error: "regionId is required" }, { status: 400 });
  }

  const cacheKey = serversByRegionCacheKey(regionId);
  const cached = await getCached<{ data: unknown[] }>(supabase, cacheKey, WORLD_GAME_TTL);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchServersByRegion(tokenRow.access_token, regionId, {
      limit: 500,
      page: 1,
    });
    await setCached(supabase, cacheKey, "world_servers", result, null);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
