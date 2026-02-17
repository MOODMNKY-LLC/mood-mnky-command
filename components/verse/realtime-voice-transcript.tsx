"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";

export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface RealtimeVoiceTranscriptProps {
  entries: TranscriptEntry[];
  className?: string;
  /** Display name for assistant (e.g. agent name) */
  assistantLabel?: string;
}

/**
 * Scrollable transcript panel for realtime voice chat (ChatGPT-style).
 * Fixed height, always visible when connected, shows empty state when no messages.
 */
export function RealtimeVoiceTranscript({
  entries,
  className,
  assistantLabel = "MNKY",
}: RealtimeVoiceTranscriptProps) {
  const isEmpty = entries.length === 0;

  return (
    <Conversation
      className={cn(
        "flex-none min-h-[160px] max-h-[240px] w-full max-w-md overflow-hidden rounded-lg border border-[var(--verse-border)] bg-[var(--verse-bg)]",
        className
      )}
    >
      <ConversationContent className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3">
        {isEmpty ? (
          <ConversationEmptyState
            icon={<Mic className="h-8 w-8 text-[var(--verse-text-muted)]" />}
            title="Speak to get started"
            description="Hold the button and say something"
            className="text-[var(--verse-text)] [&_h3]:text-[var(--verse-text)] [&_p]:text-[var(--verse-text-muted)]"
          />
        ) : (
          <>
        {entries.map((entry) => (
          <Message
            key={entry.id}
            from={entry.role}
            className={cn(
              "max-w-[95%]",
              entry.role === "user"
                ? "ml-auto rounded-lg border border-[var(--verse-border)] bg-[var(--verse-button)]/50 px-4 py-2"
                : "rounded-lg border border-[var(--verse-border)] bg-[var(--verse-button)]/35 px-4 py-2"
            )}
          >
            <MessageContent
              className={cn(
                "gap-0 border-0 bg-transparent p-0",
                "text-[var(--verse-text)]"
              )}
            >
              <span className="font-semibold text-[var(--verse-text)]">
                {entry.role === "user" ? "You" : assistantLabel}:{" "}
              </span>
              <span className="text-[var(--verse-text)]">{entry.text}</span>
            </MessageContent>
          </Message>
        ))}
          </>
        )}
      </ConversationContent>
      {!isEmpty && (
        <ConversationScrollButton className="border-[var(--verse-border)] bg-[var(--verse-bg)]" />
      )}
    </Conversation>
  );
}
