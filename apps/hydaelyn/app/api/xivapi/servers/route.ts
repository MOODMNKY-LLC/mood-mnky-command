import { NextRequest, NextResponse } from "next/server";
import { xivapiGet } from "@/lib/xivapi/client";

/**
 * GET /api/xivapi/servers
 * Proxies XIVAPI /servers or /servers/dc (when ?dc=1).
 */
export async function GET(request: NextRequest) {
  const dc = request.nextUrl.searchParams.get("dc");
  const path = dc === "1" ? "/servers/dc" : "/servers";
  try {
    const data = await xivapiGet(path);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "XIVAPI servers fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
