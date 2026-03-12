import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory registry for active calls. Not durable across restarts.
// Keyed by user id -> { callId, expiresAt }
const getRegistry = () => {
  // @ts-ignore
  if (!globalThis.__mnky_active_calls) globalThis.__mnky_active_calls = new Map<string, { callId: string; expiresAt?: number }>();
  // @ts-ignore
  return globalThis.__mnky_active_calls as Map<string, { callId: string; expiresAt?: number }>;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { callId?: string; expiresAt?: number };
  const callId = typeof body.callId === "string" ? body.callId : undefined;
  if (!callId) return NextResponse.json({ error: "Missing callId" }, { status: 400 });

  const expiresAt = typeof body.expiresAt === "number" ? body.expiresAt : undefined;
  const reg = getRegistry();
  reg.set(user.id, { callId, expiresAt });
  return NextResponse.json({ ok: true, callId });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reg = getRegistry();
  const removed = reg.delete(user.id);
  return NextResponse.json({ ok: true, removed });
}

export async function GET(request: NextRequest) {
  // public-ish: return callId for current user if set
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reg = getRegistry();
  const rec = reg.get(user.id) ?? null;
  return NextResponse.json({ call: rec });
}

