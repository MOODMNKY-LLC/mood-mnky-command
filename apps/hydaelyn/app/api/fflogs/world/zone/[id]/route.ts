import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchZone, fetchZoneDetail } from "@/lib/fflogs/client";
import { getCached, setCached, zoneCacheKey, zoneDetailCacheKey } from "@/lib/fflogs/cache";
import { WORLD_GAME_TTL } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) {
    return NextResponse.json({ error: "Invalid zone id" }, { status: 400 });
  }

  const detail = request.nextUrl.searchParams.get("detail") === "1" || request.nextUrl.searchParams.get("detail") === "true";

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

  const cacheKey = detail ? zoneDetailCacheKey(idNum) : zoneCacheKey(idNum);
  const cached = await getCached<unknown>(supabase, cacheKey, WORLD_GAME_TTL);
  if (cached) return NextResponse.json(cached);

  try {
    const result = detail
      ? await fetchZoneDetail(tokenRow.access_token, idNum)
      : await fetchZone(tokenRow.access_token, idNum);
    if (result) await setCached(supabase, cacheKey, detail ? "world_zone_detail" : "world_zone", result, null);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
