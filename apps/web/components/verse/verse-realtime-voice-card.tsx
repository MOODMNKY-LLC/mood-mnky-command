"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Persona, type PersonaState } from "@/components/ai-elements/persona";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { VerseButton } from "@/components/verse/ui/button";
import {
  RealtimeVoiceTranscript,
  type TranscriptEntry,
} from "@/components/verse/realtime-voice-transcript";
import { RealtimeVoiceToolbar } from "@/components/verse/realtime-voice-toolbar";
import { BlurFade } from "@/components/ui/blur-fade";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { useVersePersonaState } from "@/components/verse/verse-persona-state-context";
import { DEFAULT_AGENT_SLUG } from "@/lib/agents";
import { cn } from "@/lib/utils";
import supabaseLoader from "@/lib/supabase-image-loader";

type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";

const DEFAULT_SERVER_VAD = {
  type: "server_vad" as const,
  threshold: 0.3,
  prefix_padding_ms: 300,
  silence_duration_ms: 600,
  create_response: true,
  interrupt_response: true,
};

// far_field = laptop/room mics; near_field = headphones. Default far_field for web.
const SESSION_INPUT_CONFIG = {
  input_audio_transcription: {
    model: "gpt-4o-mini-transcribe" as const,
    language: "en" as const,
  },
  input_audio_noise_reduction: { type: "far_field" as const },
};

type AgentInfo = {
  slug: string;
  display_name: string;
  image_path: string | null;
} | null;

export interface VerseRealtimeVoiceCardProps {
  agentSlug?: string;
  className?: string;
  onClose?: () => void;
}

/**
 * Compact pop-up card for OpenAI Realtime API voice chat.
 * Features agent image, Elements AI SDK transcript, and compact layout.
 */
export function VerseRealtimeVoiceCard({
  agentSlug = DEFAULT_AGENT_SLUG,
  className,
  onClose,
}: VerseRealtimeVoiceCardProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const voiceStateRef = useRef<VoiceState>(voiceState);
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [isPttHeld, setIsPttHeld] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dcReady, setDcReady] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [pendingAssistantText, setPendingAssistantText] = useState("");
  const [pendingUserText, setPendingUserText] = useState("");
  const [agent, setAgent] = useState<AgentInfo>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const callIdRef = useRef<string | null>(null);
  const [vadConfig, setVadConfig] = useState(() => ({ ...DEFAULT_SERVER_VAD }));
  const isPttHeldRef = useRef(isPttHeld);
  const transcriptIdRef = useRef(0);
  const pendingAssistantRef = useRef("");
  const pendingUserRef = useRef("");
  const audioMutedRef = useRef(audioMuted);
  audioMutedRef.current = audioMuted;
  isPttHeldRef.current = isPttHeld;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { setPersonaState } = useVersePersonaState();

  useEffect(() => {
    fetch("/api/verse/agents")
      .then((r) => r.json())
      .then((data: { agents?: AgentInfo[] }) => {
        const a = data.agents?.find((x) => x && x.slug === agentSlug);
        if (a) {
          setAgent(a);
          setImageError(false);
        } else {
          setAgent(null);
        }
      })
      .catch(() => setAgent(null));
  }, [agentSlug]);

  const personaState: PersonaState =
    voiceState === "connecting" || voiceState === "thinking"
      ? "thinking"
      : voiceState === "listening"
        ? "listening"
        : voiceState === "speaking"
          ? "speaking"
          : "idle";

  useEffect(() => {
    setPersonaState(personaState);
    return () => {
      setPersonaState("idle");
    };
  }, [personaState, setPersonaState]);

  const sendEvent = useCallback((event: object) => {
    const dc = dcRef.current;
    if (dc?.readyState === "open") {
      dc.send(JSON.stringify(event));
    }
  }, []);

  const updateSession = useCallback(
    (
      updates: {
        turn_detection?: typeof DEFAULT_SERVER_VAD | null;
        input_audio_transcription?: object;
        input_audio_noise_reduction?: object;
      }
    ) => {
      sendEvent({ type: "session.update", session: updates });
    },
    [sendEvent]
  );

  useEffect(() => {
    if (dcReady) {
      updateSession({
        turn_detection: isPttHeld ? null : vadConfig,
        ...SESSION_INPUT_CONFIG,
      });
    }
  }, [isPttHeld, dcReady, updateSession]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = audioMuted;
    }
  }, [audioMuted]);

  const disconnect = useCallback(() => {
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    // best-effort server-side hangup if we know the call id
    if (callIdRef.current) {
      try {
        fetch("/api/realtime/session", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId: callIdRef.current }),
        }).catch(() => {});
      } catch {}
      try {
        // unregister callId from registry
        fetch("/api/realtime/calls/register", {
          method: "DELETE",
        }).catch(() => {});
      } catch {}
      callIdRef.current = null;
    }
    setVoiceState("idle");
    setError(null);
    setIsAuthError(false);
    setIsPttHeld(false);
    setDcReady(false);
    setImageError(false);
    setTranscript([]);
    setPendingAssistantText("");
    setPendingUserText("");
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setVoiceState("connecting");
    try {
      const res = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug: agentSlug ?? undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as {
          error?: string;
          details?: string;
        };
        const msg = d.error ?? "Failed to get session";
        const details = d.details;
        if (res.status === 401) {
          setIsAuthError(true);
          setError("Sign in to use voice chat");
          setVoiceState("error");
          return;
        }
        throw new Error(details ? `${msg}: ${details}` : msg);
      }
      const data = (await res.json()) as { clientSecret?: string };
      const clientSecret = data.clientSecret;
      if (!clientSecret) {
        throw new Error("No client secret in response");
      }

      // Build progressive constraints with graceful fallback
      let stream: MediaStream;
      try {
        const supported = navigator.mediaDevices.getSupportedConstraints
          ? navigator.mediaDevices.getSupportedConstraints()
          : {};
        const audioConstraints: any = {};
        if (supported.echoCancellation !== false) audioConstraints.echoCancellation = true;
        if (supported.noiseSuppression !== false) audioConstraints.noiseSuppression = true;
        if (supported.autoGainControl !== false) audioConstraints.autoGainControl = true;
        // prefer mono and standard sample rate when supported
        if (supported.channelCount !== false) audioConstraints.channelCount = 1;
        if (supported.sampleRate !== false) audioConstraints.sampleRate = 48000;

        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch {
        // Fallback to generic audio
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioRef.current = audioEl;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (e) => {
        if (audioEl && e.streams?.[0]) {
          audioEl.srcObject = e.streams[0];
          audioEl.muted = audioMutedRef.current;
        }
      };

      pc.addTrack(stream.getTracks()[0], stream);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      const DEBUG = process.env.NEXT_PUBLIC_DEBUG_REALTIME === "true";

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as {
            type?: string;
            delta?: string;
            transcript?: string;
            item?: { content_index?: number; transcription?: string };
          };
          const type = event.type ?? "";
          if (DEBUG && /input_audio_buffer\.(speech_started|speech_stopped)|input_audio_transcription\.(delta|added|completed)/.test(type)) {
            console.log("[Realtime]", type, type.includes("transcription") ? (event as { item?: { transcription?: string } }).item?.transcription : "");
          }
      if (type === "input_audio_buffer.speech_started") {
        // Barge-in: if assistant is speaking, cancel output and switch to listening
        if (voiceStateRef.current === "speaking") {
          try {
            sendEvent({ type: "response.cancel" });
            // stop playback immediately
            if (audioRef.current) {
              try {
                audioRef.current.pause();
                audioRef.current.srcObject = null;
                audioRef.current.src = "";
              } catch {}
            }
          } catch {}
          // fallback: request server-side hangup for the active call (best-effort)
          if (callIdRef.current) {
            try {
              fetch("/api/realtime/session", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callId: callIdRef.current }),
              }).catch(() => {});
            } catch {}
            // keep callId for potential later cleanup until disconnect
          }
        }
        if (!isPttHeldRef.current) setVoiceState("listening");
        pendingUserRef.current = "";
        setPendingUserText("");
      } else if (type === "input_audio_buffer.speech_stopped") {
        if (!isPttHeldRef.current) setVoiceState("thinking");
      } else if (
            type.startsWith("response.output_audio") ||
            type.startsWith("response.output_audio_transcript")
          ) {
            setVoiceState("speaking");
            if (type === "response.output_audio_transcript.delta" && event.delta) {
              pendingAssistantRef.current += event.delta;
              setPendingAssistantText(pendingAssistantRef.current);
            } else if (type === "response.output_audio_transcript.done") {
              const text =
                (event as { transcript?: string }).transcript ??
                pendingAssistantRef.current ??
                "";
              pendingAssistantRef.current = "";
              setPendingAssistantText("");
              const finalText = text.trim();
              if (finalText) {
                transcriptIdRef.current += 1;
                setTranscript((prev) => [
                  ...prev,
                  { id: `a-${transcriptIdRef.current}`, role: "assistant" as const, text: finalText },
                ]);
              }
            }
          } else if (type === "response.done") {
            setVoiceState("listening");
          } else if (type === "response.created") {
            setVoiceState("thinking");
            pendingAssistantRef.current = "";
            setPendingAssistantText("");
          } else if (type === "session.created") {
            setVoiceState("listening");
          } else if (type === "response.cancelled") {
            setVoiceState("listening");
            pendingAssistantRef.current = "";
            setPendingAssistantText("");
          } else if (
            type === "item.input_audio_transcription.delta" ||
            type === "conversation.item.input_audio_transcription.delta"
          ) {
            const delta = (event as { delta?: string }).delta;
            if (delta) {
              pendingUserRef.current += delta;
              setPendingUserText(pendingUserRef.current);
            }
          } else if (
            type === "item.input_audio_transcription.added" ||
            type === "conversation.item.input_audio_transcription.completed"
          ) {
            const ev = event as {
              item?: { transcription?: string };
              transcript?: string;
            };
            const transcription =
              ev.item?.transcription ?? ev.transcript ?? pendingUserRef.current;
            pendingUserRef.current = "";
            setPendingUserText("");
            if (transcription?.trim()) {
              transcriptIdRef.current += 1;
              const id = `u-${transcriptIdRef.current}`;
              setTranscript((prev) => [
                ...prev,
                { id, role: "user" as const, text: transcription.trim() },
              ]);
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      dc.onopen = () => {
        sendEvent({
          type: "session.update",
          session: {
            turn_detection: DEFAULT_SERVER_VAD,
            ...SESSION_INPUT_CONFIG,
          },
        });
        setVoiceState("listening");
        setDcReady(true);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp ?? "",
      });

      if (!sdpRes.ok) {
        const text = await sdpRes.text();
        throw new Error(`SDP negotiation failed: ${text.slice(0, 200)}`);
      }

      // Try to extract the call id from Location header for server-side controls (hangup)
      try {
        const location = sdpRes.headers.get("location") ?? sdpRes.headers.get("Location");
        if (location) {
          const parts = location.split("/");
          callIdRef.current = parts[parts.length - 1] || null;
          // register callId server-side for user-scoped control
          if (callIdRef.current) {
            try {
              fetch("/api/realtime/calls/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callId: callIdRef.current }),
              }).catch(() => {});
            } catch {}
          }
        }
      } catch {}
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setVoiceState("listening");
    } catch (err) {
      console.error("Realtime voice error:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
      setVoiceState("error");
      disconnect();
    }
  }, [agentSlug, disconnect]);

  const handleToggle = useCallback(() => {
    if (voiceState === "idle" || voiceState === "error") {
      connect();
    } else {
      disconnect();
    }
  }, [voiceState, connect, disconnect]);

  const handlePttDown = useCallback(() => {
    if (!dcReady) return;
    setIsPttHeld(true);
    setVoiceState("listening");
    sendEvent({ type: "input_audio_buffer.clear" });
    sendEvent({ type: "response.cancel" });
    sendEvent({ type: "output_audio_buffer.clear" });
  }, [dcReady, sendEvent]);

  const handlePttUp = useCallback(() => {
    if (!dcReady) return;
    setIsPttHeld(false);
    setVoiceState("thinking");
    sendEvent({ type: "input_audio_buffer.commit" });
    sendEvent({ type: "response.create" });
  }, [dcReady, sendEvent]);

  // VAD settings UI handlers
  const handleVadChange = useCallback((patch: Partial<typeof DEFAULT_SERVER_VAD>) => {
    setVadConfig((prev) => {
      const next = { ...prev, ...patch };
      if (dcReady) {
        updateSession({
          turn_detection: isPttHeld ? null : next,
          ...SESSION_INPUT_CONFIG,
        });
      }
      return next;
    });
  }, [dcReady, isPttHeld, updateSession]);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const isConnected =
    voiceState === "listening" || voiceState === "thinking" || voiceState === "speaking";
  const isConnecting = voiceState === "connecting";
  const assistantLabel = agent?.display_name ?? "MNKY";
  const imageSrc = agent?.image_path ?? "/verse/mood-mnky-3d.png";

  return (
    <div
      className={cn(
        "flex max-h-[85vh] min-h-0 flex-col gap-4 overflow-hidden rounded-xl border border-[var(--verse-border)] bg-[var(--verse-bg)] p-4 shadow-inner",
        className
      )}
    >
      {/* Small VAD settings: allow quick tuning */}
      <div className="mt-1 flex w-full items-center justify-center">
        <details className="w-full max-w-xl">
          <summary className="cursor-pointer text-xs text-muted-foreground">VAD settings</summary>
          <div className="mt-2 flex flex-col gap-2 p-2">
            <label className="text-xs text-[var(--verse-text-muted)]">Threshold: {vadConfig.threshold}</label>
            <input
              aria-label="VAD threshold"
              type="range"
              min={0.01}
              max={1}
              step={0.01}
              value={vadConfig.threshold}
              onChange={(e) => handleVadChange({ threshold: Number(e.target.value) })}
            />
            <label className="text-xs text-[var(--verse-text-muted)]">Silence (ms): {vadConfig.silence_duration_ms}</label>
            <input
              aria-label="VAD silence duration"
              type="range"
              min={100}
              max={2000}
              step={50}
              value={vadConfig.silence_duration_ms}
              onChange={(e) => handleVadChange({ silence_duration_ms: Number(e.target.value) })}
            />
          </div>
        </details>
      </div>
      {/* Header: Agent image + display name */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2",
            isConnected && voiceState === "listening" && "animate-pulse border-[var(--verse-button)]/50",
            isConnected && voiceState === "speaking" && "border-[var(--verse-button)]",
            isConnected && voiceState === "thinking" && "border-[var(--verse-text-muted)]/50",
            !isConnected && "border-[var(--verse-border)]"
          )}
        >
          {agent && !imageError ? (
            <Image
              src={imageSrc}
              alt={assistantLabel}
              width={80}
              height={80}
              loader={supabaseLoader}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Persona
              state={personaState}
              variant="halo"
              className="h-full w-full"
              themeColorVariable="--verse-text-rgb"
            />
          )}
        </div>
        {agent?.display_name && (
          <span className="text-sm font-semibold text-[var(--verse-text)]">
            {agent.display_name}
          </span>
        )}
      </div>

      {/* Transcript: always show when connected, fixed height, scrollable */}
      {isConnected && (
        <div className="min-h-0 shrink-0">
          <RealtimeVoiceTranscript
            entries={(() => {
              let out: TranscriptEntry[] = [...transcript];
              if (pendingUserText) {
                out = [
                  ...out,
                  { id: "pending-user", role: "user" as const, text: pendingUserText },
                ];
              }
              if (pendingAssistantText) {
                out = [
                  ...out,
                  {
                    id: "pending",
                    role: "assistant" as const,
                    text: pendingAssistantText,
                  },
                ];
              }
              return out;
            })()}
            assistantLabel={assistantLabel}
          />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-destructive">{error}</p>
          {isAuthError && (
            <VerseButton asChild variant="default" size="sm">
              <Link href="/auth/login">Sign in</Link>
            </VerseButton>
          )}
        </div>
      )}

      {/* Status */}
      {isConnecting && (
        <BlurFade inView={false} duration={0.3}>
          <ShimmeringText
            text="Connecting…"
            className="text-center text-[var(--verse-text)] text-sm font-medium"
            startOnView={false}
            once={false}
          />
        </BlurFade>
      )}
      {isConnected && voiceState === "listening" && (
        <BlurFade inView={false} duration={0.3}>
          <ShimmeringText
            text="Listening…"
            className="text-center text-[var(--verse-text)] text-sm font-medium"
            startOnView={false}
            once={false}
          />
        </BlurFade>
      )}
      {voiceState === "thinking" && (
        <BlurFade inView={false} duration={0.3}>
          <ShimmeringText
            text="Thinking…"
            className="text-center text-[var(--verse-text)] text-sm font-medium"
            startOnView={false}
            once={false}
          />
        </BlurFade>
      )}
      {voiceState === "speaking" && (
        <BlurFade inView={false} duration={0.3}>
          <ShimmeringText
            text="Speaking…"
            className="text-center text-[var(--verse-text)] text-sm font-semibold"
            startOnView={false}
            once={false}
          />
        </BlurFade>
      )}

      {/* Toolbar: centered, full-width unified control */}
      {isConnected && (
        <div className="flex w-full flex-shrink-0 justify-center">
          <RealtimeVoiceToolbar
            isPttHeld={isPttHeld}
            onPttDown={handlePttDown}
            onPttUp={handlePttUp}
            audioMuted={audioMuted}
            onAudioMutedChange={setAudioMuted}
            className="w-full py-2"
          />
        </div>
      )}

      {/* Actions */}
      {!isConnected ? (
        <VerseButton
          onClick={handleToggle}
          disabled={isConnecting}
          variant="default"
          size="lg"
          className="w-full rounded-full gap-2.5 py-6 text-base font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
        >
          {isConnecting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Phone className="h-5 w-5" />
          )}
          Talk to {assistantLabel}
        </VerseButton>
      ) : (
        <VerseButton
          onClick={handleToggle}
          disabled={isConnecting}
          variant="outline"
          size="lg"
          className="w-full gap-2.5 rounded-full border-[var(--verse-border)] py-6 text-base font-medium"
        >
          {isConnecting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <PhoneOff className="h-5 w-5" />
          )}
          End voice
        </VerseButton>
      )}
    </div>
  );
}
