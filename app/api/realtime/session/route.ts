import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_AGENT_SLUG, isAgentSlug } from "@/lib/agents";

export const maxDuration = 30;

/**
 * POST /api/realtime/session
 * Mints an ephemeral OpenAI Realtime client secret for the authenticated user.
 * Body: {
 *   agentSlug?: string;
 *   turn_detection?: null | { threshold?, prefix_padding_ms?, silence_duration_ms?, create_response?, interrupt_response? };
 *   input_audio_transcription?: { model: string; language?: string; prompt?: string };
 * }
 * Returns: { clientSecret: string, expiresAt: number, agentSlug?: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  } catch {
    // keep empty
  }

  let agentSlug = DEFAULT_AGENT_SLUG;
  if (body?.agentSlug && isAgentSlug(body.agentSlug as string)) {
    agentSlug = body.agentSlug as string;
  } else {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();
      const prefs = (profile?.preferences as Record<string, unknown>) ?? {};
      const slug = prefs.default_agent_slug as string | undefined;
      if (slug && isAgentSlug(slug)) agentSlug = slug;
    } catch {
      // keep default
    }
  }

  const admin = createAdminClient();
  const { data: agent } = await admin
    .from("agent_profiles")
    .select("openai_model, openai_voice, system_instructions")
    .eq("slug", agentSlug)
    .eq("is_active", true)
    .single();

  const model = agent?.openai_model ?? "gpt-realtime";
  const voice = agent?.openai_voice ?? "marin";
  const instructions =
    agent?.system_instructions?.trim() ??
    "You are a friendly assistant for the MNKY VERSE.";

  // Parse optional session overrides from request body
  let turnDetection:
    | null
    | {
        type: "server_vad";
        threshold?: number;
        prefix_padding_ms?: number;
        silence_duration_ms?: number;
        create_response?: boolean;
        interrupt_response?: boolean;
      } = {
    type: "server_vad",
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
    create_response: true,
    interrupt_response: true,
  };
  let inputAudioTranscription:
    | null
    | {
        model: string;
        language?: string;
        prompt?: string;
      } = null;

  if (body?.turn_detection === null) {
    turnDetection = null;
  } else if (body?.turn_detection && typeof body.turn_detection === "object") {
    const td = body.turn_detection as Record<string, unknown>;
    turnDetection = {
      type: "server_vad",
      threshold: (td.threshold as number) ?? 0.5,
      prefix_padding_ms: (td.prefix_padding_ms as number) ?? 300,
      silence_duration_ms: (td.silence_duration_ms as number) ?? 500,
      create_response: (td.create_response as boolean) ?? true,
      interrupt_response: (td.interrupt_response as boolean) ?? true,
    };
  }
  if (body?.input_audio_transcription && typeof body.input_audio_transcription === "object") {
    const t = body.input_audio_transcription as Record<string, unknown>;
    if (t.model) {
      inputAudioTranscription = {
        model: t.model as string,
        language: (t.language as string) ?? "en",
        prompt: t.prompt as string | undefined,
      };
    }
  }

  const sessionConfig: Record<string, unknown> = {
    type: "realtime" as const,
    model,
    instructions,
    audio: {
      output: {
        voice,
      },
    },
    turn_detection: turnDetection,
  };

  if (inputAudioTranscription) {
    sessionConfig.input_audio_transcription = inputAudioTranscription;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session: sessionConfig }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI realtime client_secrets error:", res.status, err);
      return NextResponse.json(
        { error: "Failed to create realtime session" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      value?: string;
      expires_at?: number;
    };
    const clientSecret = data.value;
    const expiresAt = data.expires_at ?? 0;

    if (!clientSecret) {
      return NextResponse.json(
        { error: "No client secret in response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      clientSecret,
      expiresAt,
      agentSlug,
    });
  } catch (e) {
    console.error("Realtime session error:", e);
    return NextResponse.json(
      { error: "Failed to create realtime session" },
      { status: 500 }
    );
  }
}
