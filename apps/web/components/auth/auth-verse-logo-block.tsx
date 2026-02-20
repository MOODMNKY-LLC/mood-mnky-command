"use client";

import { cn } from "@/lib/utils";
import { AuthLogoHair } from "./auth-logo-hair";

/**
 * Auth page logo block: Logo (top) → MNKY VERSE (primary) → SCENTS THE MOOD (tagline)
 * MNKY VERSE stays on one line (never stacked).
 */
export function AuthVerseLogoBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-start gap-1 text-center text-[var(--verse-text)]",
        className
      )}
    >
      <AuthLogoHair className="-mb-1 max-h-[104px] w-20 md:max-h-[128px] md:w-24 lg:max-h-[160px] lg:w-32" />
      <h1 className="whitespace-nowrap font-verse-logo text-3xl font-black uppercase tracking-[0.05em] text-[var(--verse-text)] md:text-4xl md:tracking-[0.06em] lg:text-5xl">
        MNKY VERSE
      </h1>
      <p className="font-verse-logo text-xs font-medium uppercase tracking-[0.25em] text-[var(--verse-text-muted)] md:text-sm md:tracking-[0.3em]">
        SCENTS THE MOOD
      </p>
    </div>
  );
}
