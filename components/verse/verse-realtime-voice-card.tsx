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
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { useVersePersonaState } from "@/components/verse/verse-persona-state-context";
import { DEFAULT_AGENT_SLUG } from "@/lib/agents";
import { cn } from "@/lib/utils";
import supabaseLoader from "@/lib/supabase-image-loader";

type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";

const DEFAULT_SERVER_VAD = {
  type: "server_vad" as const,
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 500,
  create_response: true,
  interrupt_response: true,
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
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [pttMode, setPttMode] = useState(false);
  const [isPttHeld, setIsPttHeld] = useState(false);
  const [dcReady, setDcReady] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [pendingAssistantText, setPendingAssistantText] = useState("");
  const [agent, setAgent] = useState<AgentInfo>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const pttModeRef = useRef(pttMode);
  const transcriptIdRef = useRef(0);
  const pendingAssistantRef = useRef("");
  const audioMutedRef = useRef(audioMuted);
  audioMutedRef.current = audioMuted;
  pttModeRef.current = pttMode;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { setPersonaState } = useVersePersonaState();

  useEffect(() => {
    fetch("/api/verse/agents")
      .then((r) => r.json())
      .then((data: { agents?: AgentInfo[] }) => {
        const a = data.agents?.find((x) => x && x.slug === agentSlug);
        if (a) setAgent(a);
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

  const updateTurnDetection = useCallback(
    (turnDetection: typeof DEFAULT_SERVER_VAD | null) => {
      sendEvent({
        type: "session.update",
        session: { turn_detection: turnDetection },
      });
    },
    [sendEvent]
  );

  useEffect(() => {
    if (dcReady) {
      updateTurnDetection(pttMode ? null : DEFAULT_SERVER_VAD);
    }
  }, [pttMode, dcReady, updateTurnDetection]);

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
    setVoiceState("idle");
    setError(null);
    setIsAuthError(false);
    setIsPttHeld(false);
    setDcReady(false);
    setTranscript([]);
    setPendingAssistantText("");
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
        const d = await res.json().catch(() => ({}));
        const msg = (d as { error?: string }).error ?? "Failed to get session";
        if (res.status === 401) {
          setIsAuthError(true);
          setError("Sign in to use voice chat");
          setVoiceState("error");
          return;
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as { clientSecret?: string };
      const clientSecret = data.clientSecret;
      if (!clientSecret) {
        throw new Error("No client secret in response");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as {
            type?: string;
            delta?: string;
            transcript?: string;
            item?: { content_index?: number; transcription?: string };
          };
          const type = event.type ?? "";
          if (type === "input_audio_buffer.speech_started") {
            if (!pttModeRef.current) setVoiceState("listening");
          } else if (type === "input_audio_buffer.speech_stopped") {
            if (!pttModeRef.current) setVoiceState("thinking");
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
            sendEvent({
              type: "conversation.item.create",
              item: { type: "input_text", text: "hi" },
            });
            sendEvent({ type: "response.create" });
          } else if (type === "response.cancelled") {
            setVoiceState("listening");
            pendingAssistantRef.current = "";
            setPendingAssistantText("");
          } else if (type === "item.input_audio_transcription.added") {
            const ev = event as { item?: { transcription?: string } };
            const transcription = ev.item?.transcription;
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
    if (!pttMode || !dcReady) return;
    setIsPttHeld(true);
    sendEvent({ type: "input_audio_buffer.clear" });
    sendEvent({ type: "response.cancel" });
    sendEvent({ type: "output_audio_buffer.clear" });
  }, [pttMode, dcReady, sendEvent]);

  const handlePttUp = useCallback(() => {
    if (!pttMode || !dcReady) return;
    setIsPttHeld(false);
    sendEvent({ type: "input_audio_buffer.commit" });
    sendEvent({ type: "response.create" });
  }, [pttMode, dcReady, sendEvent]);

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
        "flex flex-col gap-4 rounded-xl border border-[var(--verse-border)] bg-[var(--verse-bg)] p-4",
        className
      )}
    >
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
          {agent ? (
            <Image
              src={imageSrc}
              alt={assistantLabel}
              width={80}
              height={80}
              loader={supabaseLoader}
              className="h-full w-full object-cover"
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
          <span className="text-sm font-medium text-[var(--verse-text-muted)]">
            {agent.display_name}
          </span>
        )}
      </div>

      {/* Transcript */}
      {isConnected && (transcript.length > 0 || pendingAssistantText) && (
        <RealtimeVoiceTranscript
          entries={
            pendingAssistantText
              ? [
                  ...transcript,
                  {
                    id: "pending",
                    role: "assistant" as const,
                    text: pendingAssistantText,
                  },
                ]
              : transcript
          }
          assistantLabel={assistantLabel}
        />
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
            className="text-center text-verse-text-muted text-sm"
            startOnView={false}
            once={false}
          />
        </BlurFade>
      )}
      {isConnected && voiceState === "listening" && (
        <BlurFade inView={false} duration={0.3}>
          <ShimmeringText
            text="Listening…"
            className="text-center text-verse-text-muted text-sm"
            startOnView={false}
            once={false}
          />
        </BlurFade>
      )}
      {voiceState === "thinking" && (
        <BlurFade inView={false} duration={0.3}>
          <ShimmeringText
            text="Thinking…"
            className="text-center text-verse-text-muted text-sm"
            startOnView={false}
            once={false}
          />
        </BlurFade>
      )}
      {voiceState === "speaking" && (
        <BlurFade inView={false} duration={0.3}>
          <ShimmeringText
            text="Speaking…"
            className="text-center text-verse-text text-sm"
            startOnView={false}
            once={false}
          />
        </BlurFade>
      )}

      {/* Toolbar */}
      {isConnected && (
        <RealtimeVoiceToolbar
          pttMode={pttMode}
          onPttModeChange={setPttMode}
          isPttHeld={isPttHeld}
          onPttDown={handlePttDown}
          onPttUp={handlePttUp}
          audioMuted={audioMuted}
          onAudioMutedChange={setAudioMuted}
          className="py-2"
        />
      )}

      {/* Actions */}
      {!isConnected ? (
        <ShimmerButton
          onClick={handleToggle}
          disabled={isConnecting}
          className="gap-2 bg-[var(--verse-button)] text-[var(--verse-button-text)] hover:bg-[var(--verse-button)]/90"
          shimmerColor="rgba(255,255,255,0.4)"
        >
          {isConnecting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Phone className="h-5 w-5" />
          )}
          Talk to {assistantLabel}
        </ShimmerButton>
      ) : (
        <VerseButton
          onClick={handleToggle}
          disabled={isConnecting}
          variant="destructive"
          size="lg"
          className="gap-2"
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
