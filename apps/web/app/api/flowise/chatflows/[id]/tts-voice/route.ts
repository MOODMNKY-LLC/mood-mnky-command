/**
 * PUT /api/flowise/chatflows/[id]/tts-voice (admin only)
 * Body: { voice: string }. Upserts per-chatflow TTS voice override.
 *
 * DELETE /api/flowise/chatflows/[id]/tts-voice (admin only)
 * Removes override so chatflow uses app default.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPENAI_VOICES } from "@/lib/voice-preview";

function isValidVoice(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  return OPENAI_VOICES.includes(value.trim() as (typeof OPENAI_VOICES)[number]);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, status: 401, body: { error: "Unauthorized" } };
  }
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true;
  if (!isAdmin) {
    return { ok: false as const, status: 403, body: { error: "Forbidden" } };
  }
  return { ok: true as const, admin };
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const { id: chatflowId } = await context.params;
  if (!chatflowId?.trim()) {
    return NextResponse.json(
      { error: "Missing chatflow id" },
      { status: 400 }
    );
  }

  let body: { voice?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const voice =
    body.voice !== undefined && typeof body.voice === "string"
      ? body.voice.trim()
      : "";
  if (!voice || !isValidVoice(voice)) {
    return NextResponse.json(
      { error: "Invalid voice; use one of: " + OPENAI_VOICES.join(", ") },
      { status: 400 }
    );
  }

  const { data, error } = await auth.admin
    .from("flowise_chatflow_tts")
    .upsert(
      {
        chatflow_id: chatflowId.trim(),
        tts_voice: voice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chatflow_id" }
    )
    .select("tts_voice")
    .single();

  if (error) {
    console.error("flowise_chatflow_tts PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save voice" },
      { status: 500 }
    );
  }

  return NextResponse.json({ voice: data?.tts_voice ?? voice });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const { id: chatflowId } = await context.params;
  if (!chatflowId?.trim()) {
    return NextResponse.json(
      { error: "Missing chatflow id" },
      { status: 400 }
    );
  }

  const { error } = await auth.admin
    .from("flowise_chatflow_tts")
    .delete()
    .eq("chatflow_id", chatflowId.trim());

  if (error) {
    console.error("flowise_chatflow_tts DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove override" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
