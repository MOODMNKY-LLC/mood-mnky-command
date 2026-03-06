import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const logLineBodySchema = z.object({
  overlay_token: z.string().min(1, "overlay_token is required"),
  line_type: z.string().optional(),
  line: z.string().optional(),
});

const RATE_LIMIT_MS = 2000;
const rateLimitMap = new Map<string, number>();

function isRateLimited(token: string): boolean {
  const now = Date.now();
  const last = rateLimitMap.get(token);
  if (last != null && now - last < RATE_LIMIT_MS) return true;
  rateLimitMap.set(token, now);
  return false;
}

export async function POST(request: Request) {
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders },
    );
  }

  const parsed = logLineBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders },
    );
  }

  const { overlay_token, line_type, line } = parsed.data;

  if (isRateLimited(overlay_token)) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: corsHeaders },
    );
  }

  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("stream_sessions")
    .select("id")
    .eq("overlay_token", overlay_token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Invalid overlay token" },
      { status: 401, headers: corsHeaders },
    );
  }

  const last_log_line = {
    line_type: line_type ?? null,
    line: line ?? null,
    at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("overlay_config")
    .select("last_combat_data")
    .eq("stream_session_id", session.id)
    .maybeSingle();

  const current = (existing?.last_combat_data as Record<string, unknown>) ?? {};
  const merged = { ...current, last_log_line };

  await supabase
    .from("overlay_config")
    .upsert(
      {
        stream_session_id: session.id,
        last_combat_data: merged,
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: "stream_session_id" },
    );

  return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
}
