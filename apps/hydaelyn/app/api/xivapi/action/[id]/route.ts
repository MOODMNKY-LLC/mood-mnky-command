import { NextRequest, NextResponse } from "next/server";
import { xivapiGet } from "@/lib/xivapi/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || id.trim() === "") {
    return NextResponse.json({ error: "Action id is required" }, { status: 400 });
  }
  try {
    const data = await xivapiGet(`/Action/${id.trim()}`);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "XIVAPI action fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
