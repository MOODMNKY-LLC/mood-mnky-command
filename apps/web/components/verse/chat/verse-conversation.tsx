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

const VERSE_CONVERSATION_CLASS =
  "relative flex-1 overflow-y-hidden rounded-lg border border-[var(--verse-border)] bg-[var(--verse-bg)] text-[var(--verse-text)] verse-storefront glass-panel";

const VERSE_CONVERSATION_CONTENT_CLASS = "flex flex-col gap-8 p-4 text-verse-text";

export function VerseConversation({ className, ...props }: ConversationProps) {
  return (
    <Conversation
      className={cn(VERSE_CONVERSATION_CLASS, className)}
      {...props}
    />
  );
}

export function VerseConversationContent({
  className,
  ...props
}: ConversationContentProps) {
  return (
    <ConversationContent
      className={cn(VERSE_CONVERSATION_CONTENT_CLASS, className)}
      {...props}
    />
  );
}

const VERSE_EMPTY_CLASS =
  "flex size-full flex-col items-center justify-center gap-3 p-8 text-center text-verse-text";

export function VerseConversationEmptyState({
  className,
  title = "Meet MOOD MNKY",
  description = "Ask about fragrances, products, or discovery. Try “What candles fit a cozy evening?” or “Explore fresh scents.”",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <ConversationEmptyState
      className={cn(VERSE_EMPTY_CLASS, className)}
      title={title}
      description={description}
      icon={icon}
      {...props}
    >
      {children ?? (
        <>
          {icon && <div className="text-verse-text-muted">{icon}</div>}
          <div className="space-y-1">
            <h3 className="font-medium text-sm text-verse-text">{title}</h3>
            {description && (
              <p className="text-verse-text-muted text-sm">{description}</p>
            )}
          </div>
        </>
      )}
    </ConversationEmptyState>
  );
}

export function VerseConversationScrollButton({
  className,
  ...props
}: ConversationScrollButtonProps) {
  return (
    <ConversationScrollButton
      className={cn(
        "!absolute !bottom-4 !left-1/2 !-translate-x-1/2 rounded-full border-[var(--verse-border)] bg-[var(--verse-bg)] text-[var(--verse-text)] hover:bg-verse-button/10",
        className
      )}
      {...props}
    />
  );
}
