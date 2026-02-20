"use client";

import { useCallback, useEffect, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Orb, type AgentState } from "@/components/ui/orb";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { VerseButton } from "@/components/verse/ui/button";
import { Phone, PhoneOff, Loader2 } from "lucide-react";

const VERSE_ORB_COLORS_LIGHT: [string, string] = ["#94a3b8", "#64748b"];
const VERSE_ORB_COLORS_DARK: [string, string] = ["#c8c4c4", "#94a3b8"];

function getVerseOrbColors(): [string, string] {
  if (typeof document === "undefined") return VERSE_ORB_COLORS_LIGHT;
  const storefront = document.querySelector(".verse-storefront");
  const isDark = storefront?.getAttribute("data-verse-theme") === "dark";
  return isDark ? VERSE_ORB_COLORS_DARK : VERSE_ORB_COLORS_LIGHT;
}

export interface VerseVoiceChatProps {
  agentId: string | null;
  connectionType?: "webrtc" | "websocket";
  className?: string;
  onError?: (error: unknown) => void;
}

/**
 * Voice chat UI using ElevenLabs useConversation and Orb.
 * Renders Orb + start/end call and status. Requires agentId from config or env.
 */
export function VerseVoiceChat({
  agentId,
  connectionType = "webrtc",
  className,
  onError,
}: VerseVoiceChatProps) {
  const [agentState, setAgentState] = useState<AgentState>(null);
  const [colors, setColors] = useState<[string, string]>(VERSE_ORB_COLORS_LIGHT);

  const conversation = useConversation({
    onError: (err) => {
      console.error("VerseVoiceChat error:", err);
      onError?.(err);
    },
    onStatusChange: (ev) => {
      const status = ev?.status;
      if (status === "connected") {
        setAgentState(null);
      } else if (status === "connecting" || status === "reconnecting") {
        setAgentState("thinking");
      } else {
        setAgentState(null);
      }
    },
  });

  const { status, isSpeaking, startSession, endSession, getInputVolume, getOutputVolume } =
    conversation;

  useEffect(() => {
    setColors(getVerseOrbColors());
    const el = document.querySelector(".verse-storefront");
    if (!el) return;
    const obs = new MutationObserver(() => setColors(getVerseOrbColors()));
    obs.observe(el, { attributes: true, attributeFilter: ["data-verse-theme"] });
    return () => obs.disconnect();
  }, []);

  const derivedState: AgentState =
    agentState ??
    (status === "connected"
      ? isSpeaking
        ? "talking"
        : "listening"
      : status === "connecting" || status === "reconnecting"
        ? "thinking"
        : null);

  const getInputVolumeSafe = useCallback(() => {
    try {
      const v = getInputVolume?.() ?? 0;
      return Math.min(1, Math.pow(v, 0.5) * 2.5);
    } catch {
      return 0;
    }
  }, [getInputVolume]);

  const getOutputVolumeSafe = useCallback(() => {
    try {
      const v = getOutputVolume?.() ?? 0;
      return Math.min(1, Math.pow(v, 0.5) * 2.5);
    } catch {
      return 0;
    }
  }, [getOutputVolume]);

  const handleCall = useCallback(async () => {
    if (!agentId) return;
    if (status === "connected") {
      await endSession();
      return;
    }
    try {
      setAgentState("connecting");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startSession({
        agentId,
        connectionType,
        onStatusChange: (ev) => {
          const s = ev?.status;
          if (s === "connected") setAgentState(null);
          else if (s === "connecting" || s === "reconnecting") setAgentState("thinking");
          else setAgentState(null);
        },
      });
    } catch (err) {
      console.error("Start voice session failed:", err);
      setAgentState(null);
      onError?.(err);
    }
  }, [agentId, connectionType, status, startSession, endSession, onError]);

  const isConnecting =
    status === "connecting" || status === "reconnecting" || derivedState === "thinking";
  const isConnected = status === "connected";

  if (!agentId) {
    return (
      <div
        className={
          className ??
          "flex flex-col items-center justify-center gap-4 rounded-lg border border-[var(--verse-border)] bg-[var(--verse-bg)] p-6 text-center"
        }
      >
        <p className="text-sm text-verse-text-muted">
          Voice agent not configured. Set Agent ID in LABZ → Eleven Labs.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-[var(--verse-border)] bg-[var(--verse-bg)] p-6"
      }
    >
      <div className="relative h-48 w-48 shrink-0">
        <Orb
          colors={colors}
          agentState={derivedState}
          volumeMode="auto"
          getInputVolume={getInputVolumeSafe}
          getOutputVolume={getOutputVolumeSafe}
          className="h-full w-full"
        />
      </div>
      {isConnecting && (
        <ShimmeringText
          text="Connecting…"
          className="text-verse-text-muted text-sm"
          startOnView={false}
          once={false}
        />
      )}
      {isConnected && !isSpeaking && (
        <ShimmeringText
          text="Listening…"
          className="text-verse-text-muted text-sm"
          startOnView={false}
          once={false}
        />
      )}
      {isConnected && isSpeaking && (
        <ShimmeringText
          text="Speaking…"
          className="text-verse-text text-sm"
          startOnView={false}
          once={false}
        />
      )}
      <VerseButton
        onClick={handleCall}
        disabled={isConnecting}
        variant={isConnected ? "destructive" : "default"}
        size="lg"
        className="gap-2"
      >
        {isConnecting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isConnected ? (
          <PhoneOff className="h-5 w-5" />
        ) : (
          <Phone className="h-5 w-5" />
        )}
        {isConnected ? "End voice" : "Talk to MNKY"}
      </VerseButton>
    </div>
  );
}
