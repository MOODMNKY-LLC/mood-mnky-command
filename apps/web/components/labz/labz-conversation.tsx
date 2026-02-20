"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  type ConversationProps,
  type ConversationContentProps,
  type ConversationEmptyStateProps,
  type ConversationScrollButtonProps,
} from "@/components/ai-elements/conversation";
import { cn } from "@/lib/utils";

const LABZ_CONVERSATION_CLASS =
  "relative flex-1 overflow-y-hidden rounded-lg border border-border/50 bg-background/55 text-foreground backdrop-blur-md dark:bg-background/45 dark:border-white/10";

const LABZ_CONVERSATION_CONTENT_CLASS = "flex flex-col gap-8 p-4 text-foreground";

export function LabzConversation({ className, ...props }: ConversationProps) {
  return (
    <Conversation
      className={cn(LABZ_CONVERSATION_CLASS, className)}
      {...props}
    />
  );
}

export function LabzConversationContent({
  className,
  ...props
}: ConversationContentProps) {
  return (
    <ConversationContent
      className={cn(LABZ_CONVERSATION_CONTENT_CLASS, className)}
      {...props}
    />
  );
}

const LABZ_EMPTY_CLASS =
  "flex size-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground";

export function LabzConversationEmptyState({
  className,
  title = "CODE MNKY",
  description = "Ask CODE MNKY (MNKY LABZ virtual assistant) about formulas, fragrance oils, glossary, blending, or LABZ Pages…",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <ConversationEmptyState
      className={cn(LABZ_EMPTY_CLASS, className)}
      title={title}
      description={description}
      icon={icon}
      {...props}
    >
      {children ?? (
        <>
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div className="space-y-1">
            <h3 className="font-medium text-sm text-foreground">{title}</h3>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
        </>
      )}
    </ConversationEmptyState>
  );
}

export function LabzConversationScrollButton({
  className,
  ...props
}: ConversationScrollButtonProps) {
  return (
    <ConversationScrollButton
      className={cn(
        "!absolute !bottom-4 !left-1/2 !-translate-x-1/2 rounded-full border border-border/60 bg-background/80 text-foreground backdrop-blur-md hover:bg-muted dark:border-white/10 dark:bg-background/70",
        className
      )}
      {...props}
    />
  );
}
