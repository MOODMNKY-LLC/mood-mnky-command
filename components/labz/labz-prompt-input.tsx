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

const LABZ_INPUT_BODY_CLASS =
  "rounded-lg border border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring backdrop-blur-sm dark:border-white/10 dark:bg-background/40";

export function LabzPromptInputBody({
  className,
  ...props
}: PromptInputBodyProps) {
  return (
    <PromptInputBody
      className={cn(LABZ_INPUT_BODY_CLASS, className)}
      {...props}
    />
  );
}

export function LabzPromptInputTextarea({
  className,
  ...props
}: PromptInputTextareaProps) {
  return (
    <PromptInputTextarea
      className={cn(
        "min-h-[80px] resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none",
        className
      )}
      placeholder="Ask about formulas, oils, glossary, or LABZ Pages…"
      {...props}
    />
  );
}

export function LabzPromptInputSubmit({
  className,
  ...props
}: PromptInputSubmitProps) {
  return (
    <PromptInputSubmit
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
