"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Mic, Volume2, VolumeX } from "lucide-react";

export interface RealtimeVoiceToolbarProps {
  isPttHeld: boolean;
  onPttDown: () => void;
  onPttUp: () => void;
  audioMuted: boolean;
  onAudioMutedChange: (muted: boolean) => void;
  className?: string;
}

/**
 * Unified push-to-talk toolbar with integrated mute.
 * Single centered pill: [mute] | [Hold to talk]. SpeechInput-style pulse when held.
 */
export function RealtimeVoiceToolbar({
  isPttHeld,
  onPttDown,
  onPttUp,
  audioMuted,
  onAudioMutedChange,
  className,
}: RealtimeVoiceToolbarProps) {
  return (
    <div
      className={cn(
        "flex w-full justify-center",
        className
      )}
    >
      <TooltipProvider>
        <InputGroup
          className={cn(
            "h-auto max-w-sm flex-1 overflow-visible rounded-full border-[var(--verse-border)] bg-[var(--verse-bg)] py-2 pl-3 pr-2 shadow-sm",
            "flex items-center gap-2"
          )}
        >
          <InputGroupAddon
            align="inline-start"
            className="cursor-default py-0 pl-0 pr-1"
          >
            <PromptInputButton
              type="button"
              variant="ghost"
              size="icon-sm"
              tooltip={audioMuted ? "Unmute agent" : "Mute agent"}
              onClick={() => onAudioMutedChange(!audioMuted)}
              className="h-9 w-9 rounded-full text-[var(--verse-text)] hover:bg-[var(--verse-button)]/30 hover:text-[var(--verse-text)]"
            >
              {audioMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </PromptInputButton>
          </InputGroupAddon>

          <div className="relative flex flex-1 items-center justify-center">
            {/* SpeechInput-style pulse rings when PTT held */}
            {isPttHeld && (
              <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="absolute inset-0 animate-ping rounded-full border-2 border-[var(--verse-button)]/40"
                    style={{
                      animationDelay: `${index * 0.3}s`,
                      animationDuration: "2s",
                    }}
                  />
                ))}
              </div>
            )}

            <InputGroupButton
              type="button"
              variant={isPttHeld ? "default" : "secondary"}
              size="sm"
              className={cn(
                "relative z-10 h-14 min-w-[140px] gap-2 rounded-full border-2 border-[var(--verse-border)] transition-all active:scale-[0.98]",
                isPttHeld
                  ? "bg-[var(--verse-button)] text-[var(--verse-button-foreground)]"
                  : "bg-[var(--verse-button)]/70 text-[var(--verse-button-foreground)] hover:bg-[var(--verse-button)]/80"
              )}
              onPointerDown={onPttDown}
              onPointerUp={onPttUp}
              onPointerLeave={onPttUp}
            >
              <Mic className="h-6 w-6 shrink-0" />
              {isPttHeld ? "Listening…" : "Hold to talk"}
            </InputGroupButton>
          </div>
        </InputGroup>
      </TooltipProvider>
    </div>
  );
}
