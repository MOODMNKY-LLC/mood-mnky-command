import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchGuild } from "@/lib/fflogs/client";
import { getCached, setCached, guildCacheKey } from "@/lib/fflogs/cache";

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
  const id = url.searchParams.get("id") ? parseInt(url.searchParams.get("id")!, 10) : undefined;
  const name = url.searchParams.get("name") ?? undefined;
  const serverSlug = url.searchParams.get("serverSlug") ?? undefined;
  const serverRegion = url.searchParams.get("serverRegion") ?? undefined;

  if (id != null) {
    const cacheKey = guildCacheKey({ id });
    const cached = await getCached<unknown>(supabase, cacheKey, { ttlMinutes: 60 });
    if (cached) return NextResponse.json(cached);
    try {
      const result = await fetchGuild(tokenRow.access_token, { id });
      if (result) await setCached(supabase, cacheKey, "guild", result, null);
      return NextResponse.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : "FFLogs request failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }
  if (name && serverSlug && serverRegion) {
    const cacheKey = guildCacheKey({ name, server: serverSlug, region: serverRegion });
    const cached = await getCached<unknown>(supabase, cacheKey, { ttlMinutes: 60 });
    if (cached) return NextResponse.json(cached);
    try {
      const result = await fetchGuild(tokenRow.access_token, { name, serverSlug, serverRegion });
      if (result) await setCached(supabase, cacheKey, "guild", result, null);
      return NextResponse.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : "FFLogs request failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  return NextResponse.json(
    { error: "Provide id, or name+serverSlug+serverRegion" },
    { status: 400 },
  );
}
