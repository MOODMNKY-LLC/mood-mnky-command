"use client";

import {
  BlurFadeBlock,
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import type { MessageProps } from "@/components/ai-elements/message";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VERSE_MESSAGE_CONTENT_CLASS =
  "is-user:bg-verse-button/20 is-user:text-verse-text group-[.is-user]:rounded-lg group-[.is-user]:border group-[.is-user]:border-verse-border group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-assistant]:text-verse-text [&_.prose]:prose-verse";

export function VerseMessage({ className, ...props }: MessageProps) {
  return <Message className={cn("text-verse-text", className)} {...props} />;
}

export function VerseMessageContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <MessageContent
      className={cn(VERSE_MESSAGE_CONTENT_CLASS, className)}
      {...props}
    />
  );
}

export function VerseMessageResponse({
  className,
  isStreaming,
  isLastAssistantMessage,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  text?: string;
  isStreaming?: boolean;
  isLastAssistantMessage?: boolean;
}) {
  const useStreamingFade =
    Boolean(isStreaming) && Boolean(isLastAssistantMessage);
  return (
    <MessageResponse
      className={cn(
        "size-full text-verse-text [&_.prose]:prose-verse [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...(useStreamingFade && {
        mode: "streaming" as const,
        parseIncompleteMarkdown: true,
        BlockComponent: BlurFadeBlock,
      })}
      {...props}
    />
  );
}
