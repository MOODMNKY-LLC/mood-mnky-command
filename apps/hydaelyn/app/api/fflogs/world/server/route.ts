import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchServer } from "@/lib/fflogs/client";
import { getCached, setCached, serverCacheKey } from "@/lib/fflogs/cache";
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
  const id = url.searchParams.get("id") ? parseInt(url.searchParams.get("id")!, 10) : undefined;
  const region = url.searchParams.get("region") ?? undefined;
  const slug = url.searchParams.get("slug") ?? undefined;

  if (id == null && (!region || !slug)) {
    return NextResponse.json({ error: "Provide id, or region+slug" }, { status: 400 });
  }

  const cacheKey = serverCacheKey(id, region, slug);
  const cached = await getCached<unknown>(supabase, cacheKey, WORLD_GAME_TTL);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchServer(tokenRow.access_token, { id, region, slug });
    if (result) await setCached(supabase, cacheKey, "world_server", result, null);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
