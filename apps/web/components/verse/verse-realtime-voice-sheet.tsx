"use client";

import { VerseRealtimeVoiceCard } from "@/components/verse/verse-realtime-voice-card";

export interface VerseRealtimeVoiceSheetProps {
  agentSlug?: string;
  className?: string;
  onClose?: () => void;
}

/**
 * Thin wrapper around VerseRealtimeVoiceCard for backward compatibility.
 * Prefer using VerseRealtimeVoiceCard directly when embedding in Dialog/Popover.
 *
 * @deprecated Use VerseRealtimeVoiceCard instead.
 */
export function VerseRealtimeVoiceSheet({
  agentSlug,
  className,
  onClose,
}: VerseRealtimeVoiceSheetProps) {
  return (
    <VerseRealtimeVoiceCard
      agentSlug={agentSlug}
      className={className}
      onClose={onClose}
    />
  );
}
