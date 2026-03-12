/**
 * GET /api/flowise/tts-config
 * Query: chatflowId (optional). Returns effective voice for Dojo read-aloud.
 * If chatflowId given: per-chatflow override else app default. Else: app default only.
 * For admin + ?admin=1: returns { defaultVoice, chatflowVoices } for LABZ panel.
 *
 * PATCH /api/flowise/tts-config (admin only)
 * Body: { defaultVoice?: string }. Upserts app-wide default voice.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPENAI_VOICES } from "@/lib/voice-preview";

const CONFIG_ID = "default";
const FALLBACK_VOICE = "ballad";

function isValidVoice(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  return OPENAI_VOICES.includes(value.trim() as (typeof OPENAI_VOICES)[number]);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const chatflowId = searchParams.get("chatflowId")?.trim() || null;
  const forAdmin = searchParams.get("admin") === "1";

  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true;

  if (forAdmin && isAdmin) {
    const [configRow, chatflowRows] = await Promise.all([
      admin
        .from("flowise_tts_config")
        .select("default_voice")
        .eq("id", CONFIG_ID)
        .maybeSingle(),
      admin.from("flowise_chatflow_tts").select("chatflow_id, tts_voice"),
    ]);

    const defaultVoice =
      configRow?.default_voice && isValidVoice(configRow.default_voice)
        ? configRow.default_voice
        : FALLBACK_VOICE;

    const chatflowVoices: Record<string, string> = {};
    for (const row of chatflowRows.data ?? []) {
      if (row.chatflow_id && isValidVoice(row.tts_voice)) {
        chatflowVoices[row.chatflow_id] = row.tts_voice;
      }
    }

    return NextResponse.json({
      defaultVoice,
      chatflowVoices,
    });
  }

  if (chatflowId) {
    const { data: chatflowRow } = await admin
      .from("flowise_chatflow_tts")
      .select("tts_voice")
      .eq("chatflow_id", chatflowId)
      .maybeSingle();

    if (chatflowRow?.tts_voice && isValidVoice(chatflowRow.tts_voice)) {
      return NextResponse.json({ voice: chatflowRow.tts_voice });
    }
  }

  const { data: configRow } = await admin
    .from("flowise_tts_config")
    .select("default_voice")
    .eq("id", CONFIG_ID)
    .maybeSingle();

  const voice =
    configRow?.default_voice && isValidVoice(configRow.default_voice)
      ? configRow.default_voice
      : FALLBACK_VOICE;

  return NextResponse.json({ voice });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true;
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { defaultVoice?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawDefault =
    body.defaultVoice !== undefined && typeof body.defaultVoice === "string"
      ? body.defaultVoice.trim() || null
      : undefined;

  if (rawDefault !== undefined && rawDefault !== null && !isValidVoice(rawDefault)) {
    return NextResponse.json(
      { error: "Invalid defaultVoice; use one of: " + OPENAI_VOICES.join(", ") },
      { status: 400 }
    );
  }

  const { data: existing } = await admin
    .from("flowise_tts_config")
    .select("default_voice")
    .eq("id", CONFIG_ID)
    .maybeSingle();

  const defaultVoice =
    rawDefault !== undefined
      ? (rawDefault ?? FALLBACK_VOICE)
      : (existing?.default_voice && isValidVoice(existing.default_voice)
          ? existing.default_voice
          : FALLBACK_VOICE);

  const { data, error } = await admin
    .from("flowise_tts_config")
    .upsert(
      {
        id: CONFIG_ID,
        default_voice: defaultVoice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("default_voice")
    .single();

  if (error) {
    console.error("flowise_tts_config PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    defaultVoice: data?.default_voice ?? FALLBACK_VOICE,
  });
}
