import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_AGENT_SLUG, isAgentSlug } from "@/lib/agents";

export const maxDuration = 30;
const REALTIME_FETCH_TIMEOUT_MS = (Number(process.env.REALTIME_FETCH_TIMEOUT_MS) || maxDuration) * 1000;

/**
 * POST /api/realtime/session
 * Mints an ephemeral OpenAI Realtime client secret for the authenticated user.
 * Body: { agentSlug?: string }
 * Returns: { clientSecret: string, expiresAt: number, agentSlug?: string }
 *
 * Note: turn_detection and input_audio_transcription are configured client-side
 * via session.update after the WebRTC connection is established.
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

  // Realtime API only supports gpt-realtime (and optionally dated variants)
  const REALTIME_MODELS = new Set(["gpt-realtime", "gpt-realtime-2025-08-28"]);
  const rawModel = agent?.openai_model ?? "gpt-realtime";
  const model = REALTIME_MODELS.has(rawModel) ? rawModel : "gpt-realtime";

  // Realtime supports only: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar (no fable/nova/onyx)
  const REALTIME_VOICES = new Set([
    "alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar",
  ]);
  const rawVoice = agent?.openai_voice ?? "marin";
  const voice = REALTIME_VOICES.has(rawVoice) ? rawVoice : "marin";

  const base =
    agent?.system_instructions?.trim() ??
    `You are a friendly assistant for the MNKY VERSE.

## Language
- The conversation will be only in English.
- Do not respond in any other language, even if the user asks.
- If the user speaks another language, politely explain that support is limited to English.`;

  const voiceModeSuffix = `

## Voice call
You're in a live voice conversation. Be responsive: listen to what the user says and reply naturally. Keep answers brief (1–3 sentences) unless they ask for more. Let the user lead the conversation.`;

  const instructions = base + voiceModeSuffix;

  // Session config for client_secrets. Note: turn_detection and input_audio_transcription
  // are NOT supported here - they are sent via session.update after WebRTC connect.
  const sessionConfig: Record<string, unknown> = {
    type: "realtime" as const,
    model,
    instructions,
    audio: {
      output: {
        voice,
      },
    },
  };

  try {
    // Create client secret with timeout/abort support
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), REALTIME_FETCH_TIMEOUT_MS);
    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session: sessionConfig }),
      signal: ac.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI realtime client_secrets error:", res.status, errText);
      let openAiMessage = "Unknown error";
      try {
        const errJson = JSON.parse(errText) as { error?: { message?: string }; message?: string };
        openAiMessage =
          errJson?.error?.message ?? errJson?.message ?? errText.slice(0, 200);
      } catch {
        openAiMessage = errText.slice(0, 200) || "Unknown error";
      }
      return NextResponse.json(
        {
          error: "Failed to create realtime session",
          details: openAiMessage,
        },
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

/**
 * DELETE /api/realtime/session
 * Optional body: { callId?: string, responseId?: string }
 * Server-side cancellation/hangup support for realtime calls/responses.
 */
export async function DELETE(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  } catch {
    // ignore
  }

  const callId = typeof body.callId === "string" ? body.callId : undefined;
  const responseId = typeof body.responseId === "string" ? body.responseId : undefined;

  if (!callId && !responseId) {
    return NextResponse.json({ error: "Missing callId or responseId" }, { status: 400 });
  }

  try {
    if (callId) {
      const hangupRes = await fetch(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/hangup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      const text = await hangupRes.text().catch(() => "");
      if (!hangupRes.ok) {
        console.error("Realtime hangup error:", hangupRes.status, text);
        return NextResponse.json({ error: "Failed to hangup call", details: text }, { status: 502 });
      }
      return NextResponse.json({ ok: true, callId });
    }

    if (responseId) {
      const cancelRes = await fetch(`https://api.openai.com/v1/responses/${encodeURIComponent(responseId)}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      const json = await cancelRes.json().catch(() => ({}));
      if (!cancelRes.ok) {
        console.error("Response cancel error:", cancelRes.status, json);
        return NextResponse.json({ error: "Failed to cancel response", details: json }, { status: 502 });
      }
      return NextResponse.json({ ok: true, responseId, result: json });
    }
  } catch (err) {
    console.error("Realtime cancellation error:", err);
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
  }
  return NextResponse.json({ error: "Unknown" }, { status: 500 });
}
