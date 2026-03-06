import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchReportList } from "@/lib/fflogs/client";
import { fetchReportDetail } from "@/lib/fflogs/client";
import type { FFLogsCharacter } from "@/lib/fflogs/client";

export const dynamic = "force-dynamic";

/**
 * Returns a suggested "default" character from the authenticated user's most recent report
 * (first ranked character), so the Characters page can pre-fill name + server + region.
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
    .select("access_token, fflogs_user_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!tokenRow?.access_token || tokenRow?.fflogs_user_id == null) {
    return NextResponse.json(
      { error: "FFLogs not linked" },
      { status: 403 },
    );
  }

  try {
    const list = await fetchReportList(tokenRow.access_token, tokenRow.fflogs_user_id, { limit: 1, page: 1 });
    const reports = list?.data ?? [];
    const firstCode = reports[0]?.code;
    if (!firstCode) {
      return NextResponse.json({ defaultCharacter: null });
    }
    const report = await fetchReportDetail(tokenRow.access_token, firstCode, {
      includeFights: false,
      expandMeta: true,
    });
    const ranked = report.rankedCharacters ?? [];
    const first = ranked[0] as FFLogsCharacter | undefined;
    const regionSlug = first?.region?.slug ?? first?.server?.region?.slug;
    if (!first?.name || !first?.server?.slug || !regionSlug) {
      return NextResponse.json({ defaultCharacter: null });
    }
    return NextResponse.json({
      defaultCharacter: {
        name: first.name,
        serverSlug: first.server.slug,
        serverRegion: regionSlug,
        id: first.id,
      },
    });
  } catch {
    return NextResponse.json({ defaultCharacter: null });
  }
}
