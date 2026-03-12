"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, PauseIcon, PlayIcon, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VOICE_PREVIEW_PHRASE } from "@/lib/voice-preview";
import { cn } from "@/lib/utils";

export type VoicePreviewState = "idle" | "loading" | "playing" | "paused";

export interface VoicePreviewButtonProps {
  /** Voice id (e.g. OpenAI voice: ballad, alloy, etc.) */
  voice: string;
  /** Optional phrase; default uses VOICE_PREVIEW_PHRASE with {voice} replaced */
  phrase?: string;
  /** Called when preview fails */
  onError?: (error: string) => void;
  /** Disable the button (e.g. while saving) */
  disabled?: boolean;
  className?: string;
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Accessible label override */
  "aria-label"?: string;
}

/**
 * Elements-style voice preview button: play / pause / loading states.
 * Calls POST /api/audio/speech with the given voice and phrase, then plays
 * the result. Supports pause and resume during playback.
 */
export function VoicePreviewButton({
  voice,
  phrase,
  onError,
  disabled = false,
  className,
  size = "icon",
  variant = "outline",
  "aria-label": ariaLabel,
}: VoicePreviewButtonProps) {
  const [state, setState] = useState<VoicePreviewState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    audioRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cleanup();
    setState("idle");
  }, [cleanup]);

  const handleClick = useCallback(async () => {
    if (disabled) return;

    if (state === "playing" || state === "paused") {
      if (state === "playing" && audioRef.current) {
        audioRef.current.pause();
        setState("paused");
      } else if (state === "paused" && audioRef.current) {
        audioRef.current.play();
        setState("playing");
      }
      return;
    }

    if (state === "loading") return;

    const text =
      phrase ??
      VOICE_PREVIEW_PHRASE.replace("{voice}", voice);

    setState("loading");
    onError?.("");

    try {
      const res = await fetch("/api/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          input: text,
          voice,
          saveToLibrary: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Preview failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        cleanup();
        setState("idle");
      };
      audio.onerror = () => {
        cleanup();
        setState("idle");
        onError?.("Playback failed");
      };

      await audio.play();
      setState("playing");
    } catch (e) {
      cleanup();
      setState("idle");
      const message = e instanceof Error ? e.message : "Preview failed";
      onError?.(message);
    }
  }, [disabled, voice, phrase, state, onError, cleanup]);

  const label =
    ariaLabel ??
    (state === "playing"
      ? "Stop preview"
      : state === "paused"
        ? "Resume preview"
        : "Preview voice");

  const icon =
    state === "loading" ? (
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
    ) : state === "playing" ? (
      <PauseIcon className="h-4 w-4" aria-hidden />
    ) : state === "paused" ? (
      <PlayIcon className="h-4 w-4" aria-hidden />
    ) : (
      <Volume2 className="h-4 w-4" aria-hidden />
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={handleClick}
          disabled={disabled || state === "loading"}
          aria-label={label}
          className={cn(state === "playing" && "bg-primary/10 text-primary", className)}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
