import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLodestoneCharacter } from "@/lib/lodestone/xivapi";

export const dynamic = "force-dynamic";

/**
 * GET /api/lodestone/character
 * Query: lodestoneId=123  OR  name=Character+Name&server=ServerName
 * Returns character profile (ClassJobs, etc.) from Lodestone via XIVAPI.
 * Auth required.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const lodestoneIdParam = url.searchParams.get("lodestoneId");
  const name = url.searchParams.get("name") ?? "";
  const server = url.searchParams.get("server") ?? "";

  const lodestoneId = lodestoneIdParam ? parseInt(lodestoneIdParam, 10) : NaN;

  if (!Number.isNaN(lodestoneId) && lodestoneId > 0) {
    try {
      const data = await getLodestoneCharacter({ lodestoneId });
      if (data) return NextResponse.json(data);
      return NextResponse.json(
        { error: "Character not found on Lodestone for this ID." },
        { status: 404 },
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Lodestone request failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (name.trim() && server.trim()) {
    try {
      const data = await getLodestoneCharacter({
        name: name.trim(),
        server: server.trim(),
      });
      if (data) return NextResponse.json(data);
      return NextResponse.json(
        { error: "Character not found on Lodestone for this name and server." },
        { status: 404 },
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Lodestone request failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  return NextResponse.json(
    { error: "Provide lodestoneId or name and server." },
    { status: 400 },
  );
}
