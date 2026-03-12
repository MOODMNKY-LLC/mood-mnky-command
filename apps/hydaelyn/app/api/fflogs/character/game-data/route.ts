import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCharacterGameData } from "@/lib/fflogs/client";
import { getCached, setCached, characterGameDataCacheKey } from "@/lib/fflogs/cache";

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

  const specIDParam = url.searchParams.get("specID");
  const specID = specIDParam ? parseInt(specIDParam, 10) : undefined;
  const forceUpdate = url.searchParams.get("forceUpdate") === "true" || url.searchParams.get("forceUpdate") === "1";

  const options: { specID?: number; forceUpdate?: boolean } = {};
  if (specID != null && !Number.isNaN(specID)) options.specID = specID;
  options.forceUpdate = forceUpdate;

  if (!forceUpdate) {
    const cacheKey = characterGameDataCacheKey(characterId, options.specID, false);
    const cached = await getCached<unknown>(supabase, cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  function isExpiredMessage(value: unknown): value is string {
    return typeof value === "string" && /cached data.*expired|update the character on the site/i.test(value);
  }

  try {
    let result = await fetchCharacterGameData(tokenRow.access_token, characterId, options);
    // When FFLogs returns the "cached data expired" string, retry once with forceUpdate to fetch fresh Lodestone data
    if (isExpiredMessage(result) && !options.forceUpdate) {
      result = await fetchCharacterGameData(tokenRow.access_token, characterId, { ...options, forceUpdate: true });
    }
    if (result != null && !isExpiredMessage(result)) {
      const cacheKey = characterGameDataCacheKey(characterId, options.specID, false);
      await setCached(supabase, cacheKey, "character_game_data", result, null);
      return NextResponse.json(result);
    }
    if (isExpiredMessage(result)) {
      return NextResponse.json({
        cacheExpired: true,
        message: result,
      });
    }
    return NextResponse.json(result ?? {});
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
