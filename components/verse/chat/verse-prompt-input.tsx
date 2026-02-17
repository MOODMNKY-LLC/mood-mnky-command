"use client";

import {
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputBodyProps,
  type PromptInputSubmitProps,
  type PromptInputTextareaProps,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

const VERSE_INPUT_BODY_CLASS =
  "rounded-lg border border-[var(--verse-border)] bg-[var(--verse-bg)] text-verse-text placeholder:text-verse-text-muted focus-within:ring-2 focus-within:ring-verse-button/30";

export function VersePromptInputBody({
  className,
  ...props
}: PromptInputBodyProps) {
  return (
    <PromptInputBody
      className={cn(VERSE_INPUT_BODY_CLASS, className)}
      {...props}
    />
  );
}

export function VersePromptInputTextarea({
  className,
  ...props
}: PromptInputTextareaProps) {
  return (
    <PromptInputTextarea
      className={cn(
        "min-h-[80px] resize-none bg-transparent text-verse-text placeholder:text-verse-text-muted focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function VersePromptInputSubmit({
  className,
  ...props
}: PromptInputSubmitProps) {
  return (
    <PromptInputSubmit
      className={cn(
        "shrink-0 !bg-verse-button !text-verse-button-text hover:!bg-verse-button/90",
        className
      )}
      {...props}
    />
  );
}
