"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { cn } from "@/lib/utils";

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
 * Scrollable transcript panel for realtime voice chat.
 * Uses Elements AI SDK Message + Conversation for consistent styling.
 */
export function RealtimeVoiceTranscript({
  entries,
  className,
  assistantLabel = "MNKY",
}: RealtimeVoiceTranscriptProps) {
  if (entries.length === 0) return null;

  return (
    <Conversation
      className={cn(
        "h-32 min-h-0 w-full max-w-md rounded-md border border-[var(--verse-border)]",
        className
      )}
    >
      <ConversationContent className="flex flex-col gap-3 overflow-y-auto p-3">
        {entries.map((entry) => (
          <Message
            key={entry.id}
            from={entry.role}
            className={cn(
              "max-w-[95%]",
              entry.role === "user"
                ? "ml-auto rounded-lg bg-[var(--verse-border)]/30 px-4 py-2"
                : "rounded-lg bg-[var(--verse-button)]/20 px-4 py-2"
            )}
          >
            <MessageContent
              className={cn(
                "gap-0 border-0 bg-transparent p-0",
                entry.role === "user"
                  ? "bg-transparent text-[var(--verse-text)]"
                  : "bg-transparent text-[var(--verse-text)]"
              )}
            >
              <span className="font-medium text-[var(--verse-text-muted)]">
                {entry.role === "user" ? "You" : assistantLabel}:{" "}
              </span>
              {entry.text}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton className="border-[var(--verse-border)] bg-[var(--verse-bg)]" />
    </Conversation>
  );
}
