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

const LABZ_MESSAGE_CONTENT_CLASS =
  "group-[.is-user]:rounded-lg group-[.is-user]:border group-[.is-user]:border-border group-[.is-user]:bg-muted group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-assistant]:text-foreground";

export function LabzMessage({ className, ...props }: MessageProps) {
  return <Message className={cn("text-foreground", className)} {...props} />;
}

export function LabzMessageContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <MessageContent
      className={cn(LABZ_MESSAGE_CONTENT_CLASS, className)}
      {...props}
    />
  );
}

export function LabzMessageResponse({
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
        "size-full text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
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
