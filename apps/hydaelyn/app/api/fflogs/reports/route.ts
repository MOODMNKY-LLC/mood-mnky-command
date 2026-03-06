import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchReportList, refreshAccessToken } from "@/lib/fflogs/client";
import { getCached, setCached, reportListCacheKey } from "@/lib/fflogs/cache";

export const dynamic = "force-dynamic";

const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now() + EXPIRY_BUFFER_MS;
}

function isAuthError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    /401|unauthorized|token expired|authentication failed/i.test(msg) ||
    /FFLogs token exchange failed: 401/i.test(msg) ||
    /FFLogs report list failed: 401/i.test(msg)
  );
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tokenRow } = await supabase
    .from("user_fflogs_tokens")
    .select("access_token, refresh_token, expires_at, fflogs_user_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!tokenRow?.access_token || !tokenRow?.fflogs_user_id) {
    return NextResponse.json(
      { error: "FFLogs not linked. Link your FFLogs account from the dashboard." },
      { status: 403 },
    );
  }

  let accessToken = tokenRow.access_token;

  if (isExpired(tokenRow.expires_at)) {
    if (tokenRow.refresh_token) {
      try {
        const tokens = await refreshAccessToken(tokenRow.refresh_token);
        const expiresAt = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : new Date(Date.now() + 3600 * 1000).toISOString();
        await supabase
          .from("user_fflogs_tokens")
          .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token ?? tokenRow.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", user.id);
        accessToken = tokens.access_token;
      } catch (refreshErr) {
        console.error("[FFLogs] token refresh failed:", refreshErr);
        return NextResponse.json(
          {
            error:
              "FFLogs token expired; please re-link your account from the dashboard.",
          },
          { status: 401 },
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "FFLogs token expired; please re-link your account from the dashboard.",
        },
        { status: 401 },
      );
    }
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
  const startTime = url.searchParams.get("startTime") ? parseInt(url.searchParams.get("startTime")!, 10) : undefined;
  const endTime = url.searchParams.get("endTime") ? parseInt(url.searchParams.get("endTime")!, 10) : undefined;
  const zoneID = url.searchParams.get("zoneID") ? parseInt(url.searchParams.get("zoneID")!, 10) : undefined;
  const gameZoneID = url.searchParams.get("gameZoneID") ? parseInt(url.searchParams.get("gameZoneID")!, 10) : undefined;
  const guildID = url.searchParams.get("guildID") ? parseInt(url.searchParams.get("guildID")!, 10) : undefined;
  const guildTagID = url.searchParams.get("guildTagID") ? parseInt(url.searchParams.get("guildTagID")!, 10) : undefined;

  const listOpts = { page, limit, startTime, endTime, zoneID, gameZoneID, guildID, guildTagID };
  const cacheKey = reportListCacheKey(tokenRow.fflogs_user_id, page, {
    startTime,
    endTime,
    zoneID,
    guildID,
  });
  const cached = await getCached<{ data: unknown[]; hasMorePages: boolean; lastPage: number }>(
    supabase,
    cacheKey,
  );
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const result = await fetchReportList(accessToken, tokenRow.fflogs_user_id, listOpts);
    await setCached(supabase, cacheKey, "report_list", result, null);
    return NextResponse.json(result);
  } catch (e) {
    if (isAuthError(e)) {
      return NextResponse.json(
        {
          error:
            "FFLogs token expired; please re-link your account from the dashboard.",
        },
        { status: 401 },
      );
    }
    console.error("[FFLogs] reports request failed:", e);
    const message = e instanceof Error ? e.message : "FFLogs request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
