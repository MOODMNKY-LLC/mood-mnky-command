"use client";

import { User } from "lucide-react";

export type VerseUserForPill = {
  id: string;
  email?: string;
  displayName?: string;
} | null;

export function VerseChatUserPill({ user }: { user: VerseUserForPill }) {
  if (!user) return null;

  const label = user.displayName ?? user.email ?? "You";

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-[var(--verse-border)] bg-[var(--verse-bg)] px-3 py-1.5 text-verse-text-muted"
      title={`Chatting as ${label}`}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-verse-button/20 text-verse-text">
        <User className="size-3.5" />
      </span>
      <span className="truncate text-xs font-medium max-w-[120px] sm:max-w-[160px]">
        {label}
      </span>
    </div>
  );
}
