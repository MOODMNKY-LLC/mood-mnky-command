import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchFFLogsUserProfile } from "@/lib/fflogs/client";
import { getCached, setCached, userProfileCacheKey } from "@/lib/fflogs/cache";
import type { FFLogsUserProfile } from "@/lib/fflogs/client";

export const dynamic = "force-dynamic";

const PROFILE_CACHE_TTL_MINUTES = 5;

/**
 * Returns the authenticated user's FFLogs profile: claimed characters and guilds/statics.
 * Requires FFLogs linked with view-user-profile scope (re-link if you linked before this was added).
 */
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

  const cacheKey = userProfileCacheKey(user.id);
  const cached = await getCached<FFLogsUserProfile>(supabase, cacheKey, {
    ttlMinutes: PROFILE_CACHE_TTL_MINUTES,
  });
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const profile = await fetchFFLogsUserProfile(tokenRow.access_token);
    await setCached(supabase, cacheKey, "user_profile", profile, null);
    return NextResponse.json(profile);
  } catch (e) {
    const message = e instanceof Error ? e.message : "FFLogs profile request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
