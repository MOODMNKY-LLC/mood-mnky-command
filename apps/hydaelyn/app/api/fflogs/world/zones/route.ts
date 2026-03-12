import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchZones } from "@/lib/fflogs/client";
import { getCached, setCached, zonesCacheKey } from "@/lib/fflogs/cache";
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
  const expansionId = url.searchParams.get("expansion_id") ? parseInt(url.searchParams.get("expansion_id")!, 10) : undefined;

  const cacheKey = zonesCacheKey(expansionId);
  const cached = await getCached<unknown[]>(supabase, cacheKey, WORLD_GAME_TTL);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchZones(tokenRow.access_token, expansionId);
    await setCached(supabase, cacheKey, "world_zones", result, null);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
