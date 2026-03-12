import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRegions } from "@/lib/fflogs/client";
import { getCached, setCached, regionsCacheKey } from "@/lib/fflogs/cache";
import { WORLD_GAME_TTL } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const cacheKey = regionsCacheKey();
  const cached = await getCached<unknown[]>(supabase, cacheKey, WORLD_GAME_TTL);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchRegions(tokenRow.access_token);
    await setCached(supabase, cacheKey, "world_regions", result, null);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
