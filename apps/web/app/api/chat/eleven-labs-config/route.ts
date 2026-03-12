import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CONFIG_ID = "default";

export type ElevenLabsConfigGet = {
  agentId: string | null;
  hasApiKeyOverride?: boolean;
  connectionType?: string;
  defaultVoiceId?: string | null;
  showTranscriptViewer?: boolean;
  showWaveformInVoiceBlock?: boolean;
  pronunciationDictionaryLocators?: Array<{
    pronunciation_dictionary_id: string;
    version_id?: string;
  }> | null;
};

/**
 * GET: Returns agent ID (for Verse/client). If authenticated admin, also returns hasApiKeyOverride and connectionType.
 */
export async function GET() {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("eleven_labs_config")
    .select("agent_id, api_key_override, connection_type, default_voice_id, show_transcript_viewer, show_waveform_in_voice_block")
    .eq("id", CONFIG_ID)
    .maybeSingle();

  if (error) {
    console.error("ElevenLabs config GET error:", error);
    // 42P01 = relation does not exist; return env fallback so client can still work
    if (error.code === "42P01") {
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? null;
      return NextResponse.json({ agentId });
    }
    return NextResponse.json(
      { error: "Failed to load config" },
      { status: 500 }
    );
  }

  const agentId =
    row?.agent_id ?? process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? null;

  const pronDictId = process.env.ELEVENLABS_PRON_DICT_ID?.trim();
  const pronunciationDictionaryLocators = pronDictId
    ? [
        {
          pronunciation_dictionary_id: pronDictId,
          version_id: process.env.ELEVENLABS_PRON_DICT_VERSION_ID?.trim() || undefined,
        },
      ]
    : null;

  const response: ElevenLabsConfigGet = {
    agentId,
    defaultVoiceId: row?.default_voice_id ?? null,
    showTranscriptViewer: row?.show_transcript_viewer ?? false,
    showWaveformInVoiceBlock: row?.show_waveform_in_voice_block ?? false,
    pronunciationDictionaryLocators,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin" || profile?.is_admin === true;
    if (isAdmin) {
      response.hasApiKeyOverride = Boolean(row?.api_key_override);
      response.connectionType = row?.connection_type ?? "webrtc";
    }
  }

  return NextResponse.json(response);
}

/**
 * PATCH: Update config (admin only). Body: { agentId?, apiKeyOverride?, connectionType? }
 */
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

  let body: {
    agentId?: string;
    apiKeyOverride?: string | null;
    connectionType?: string;
    defaultVoiceId?: string | null;
    showTranscriptViewer?: boolean;
    showWaveformInVoiceBlock?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const updates: {
    agent_id?: string;
    api_key_override?: string | null;
    connection_type?: string;
    default_voice_id?: string | null;
    show_transcript_viewer?: boolean;
    show_waveform_in_voice_block?: boolean;
    updated_at?: string;
  } = { updated_at: new Date().toISOString() };

  if (body.agentId !== undefined) updates.agent_id = body.agentId || null;
  // Only update api_key_override when explicitly provided (empty string = clear).
  if (Object.prototype.hasOwnProperty.call(body, "apiKeyOverride"))
    updates.api_key_override = body.apiKeyOverride || null;
  if (body.connectionType !== undefined)
    updates.connection_type = body.connectionType || "webrtc";
  if (Object.prototype.hasOwnProperty.call(body, "defaultVoiceId"))
    updates.default_voice_id = body.defaultVoiceId?.trim() || null;
  if (body.showTranscriptViewer !== undefined)
    updates.show_transcript_viewer = body.showTranscriptViewer;
  if (body.showWaveformInVoiceBlock !== undefined)
    updates.show_waveform_in_voice_block = body.showWaveformInVoiceBlock;

  const { data, error } = await admin
    .from("eleven_labs_config")
    .upsert(
      { id: CONFIG_ID, ...updates },
      { onConflict: "id" }
    )
    .select("agent_id, connection_type, default_voice_id, show_transcript_viewer, show_waveform_in_voice_block")
    .single();

  if (error) {
    console.error("ElevenLabs config PATCH error:", error);
    const message =
      process.env.NODE_ENV === "development"
        ? (error.message || "Failed to save config")
        : "Failed to save config";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    agentId: data?.agent_id ?? null,
    connectionType: data?.connection_type ?? "webrtc",
    defaultVoiceId: data?.default_voice_id ?? null,
    showTranscriptViewer: data?.show_transcript_viewer ?? false,
    showWaveformInVoiceBlock: data?.show_waveform_in_voice_block ?? false,
  });
}
