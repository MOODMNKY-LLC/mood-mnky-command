"use client";

import { VerseButton } from "@/components/verse/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

export interface RealtimeVoiceToolbarProps {
  pttMode: boolean;
  onPttModeChange: (enabled: boolean) => void;
  isPttHeld: boolean;
  onPttDown: () => void;
  onPttUp: () => void;
  audioMuted: boolean;
  onAudioMutedChange: (muted: boolean) => void;
  className?: string;
}

/**
 * Bottom toolbar for realtime voice: PTT toggle, hold-to-talk, audio playback toggle.
 */
export function RealtimeVoiceToolbar({
  pttMode,
  onPttModeChange,
  isPttHeld,
  onPttDown,
  onPttUp,
  audioMuted,
  onAudioMutedChange,
  className,
}: RealtimeVoiceToolbarProps) {
  return (
    <div
      className={
        className ??
        "flex flex-wrap items-center justify-center gap-3 rounded-lg border border-[var(--verse-border)] bg-[var(--verse-bg)]/80 p-3"
      }
    >
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--verse-text-muted)]">
        <input
          type="checkbox"
          checked={pttMode}
          onChange={(e) => onPttModeChange(e.target.checked)}
          className="rounded border-[var(--verse-border)]"
        />
        Push-to-talk
      </label>
      {pttMode && (
        <VerseButton
          variant="secondary"
          size="default"
          className="gap-2 min-w-[120px]"
          onPointerDown={onPttDown}
          onPointerUp={onPttUp}
          onPointerLeave={onPttUp}
        >
          {isPttHeld ? (
            <Mic className="h-4 w-4 text-primary" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
          {isPttHeld ? "Listening…" : "Hold to talk"}
        </VerseButton>
      )}
      <VerseButton
        variant="ghost"
        size="icon"
        onClick={() => onAudioMutedChange(!audioMuted)}
        title={audioMuted ? "Unmute agent" : "Mute agent"}
        className="shrink-0"
      >
        {audioMuted ? (
          <VolumeX className="h-4 w-4 text-[var(--verse-text-muted)]" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </VerseButton>
    </div>
  );
}
