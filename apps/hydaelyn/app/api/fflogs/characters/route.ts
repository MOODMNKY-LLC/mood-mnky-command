import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchGuildCharacters } from "@/lib/fflogs/client";
import { getCached, setCached, guildCharactersCacheKey } from "@/lib/fflogs/cache";

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
  const guildID = url.searchParams.get("guildID") ? parseInt(url.searchParams.get("guildID")!, 10) : undefined;
  if (guildID == null || Number.isNaN(guildID)) {
    return NextResponse.json({ error: "guildID is required" }, { status: 400 });
  }

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "100", 10)));

  const cacheKey = guildCharactersCacheKey(guildID, page);
  const cached = await getCached<{ data: unknown[] }>(supabase, cacheKey, { ttlMinutes: 60 });
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchGuildCharacters(tokenRow.access_token, guildID, { page, limit });
    await setCached(supabase, cacheKey, "guild_characters", result, null);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
