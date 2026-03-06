import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchGuildAttendance } from "@/lib/fflogs/client";
import { getCached, setCached, guildAttendanceCacheKey } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guildId = parseInt(id, 10);
  if (Number.isNaN(guildId)) {
    return NextResponse.json({ error: "Invalid guild id" }, { status: 400 });
  }

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
  const guildTagID = url.searchParams.get("guildTagID");
  const zoneID = url.searchParams.get("zoneID");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "16", 10), 1), 25);

  const opts = {
    guildTagID: guildTagID != null ? parseInt(guildTagID, 10) : undefined,
    zoneID: zoneID != null ? parseInt(zoneID, 10) : undefined,
    page,
    limit,
  };
  const cacheKey = guildAttendanceCacheKey(guildId, opts);
  const cached = await getCached<unknown>(supabase, cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchGuildAttendance(tokenRow.access_token, guildId, opts);
    if (result != null) await setCached(supabase, cacheKey, "guild_attendance", result, null);
    return NextResponse.json(result ?? {});
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
