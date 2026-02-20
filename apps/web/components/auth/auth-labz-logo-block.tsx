"use client";

import { cn } from "@/lib/utils";

/**
 * Auth page logo block for MNKY LABZ: MNKY LABZ (primary) → MNKY VERSE COMMAND CENTER (tagline)
 * Uses verse tokens for theme-aware contrast. Spacer matches Verse logo height so heading aligns when switching tabs.
 */
export function AuthLabzLogoBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-start gap-1 text-center text-[var(--verse-text)]",
        className
      )}
    >
      {/* Spacer so MNKY LABZ heading aligns with MNKY VERSE (same as AuthLogoHair height) */}
      <div className="-mb-1 h-[104px] w-20 md:h-[128px] md:w-24 lg:h-[160px] lg:w-32 shrink-0" aria-hidden />
      <h1 className="whitespace-nowrap font-verse-logo text-3xl font-black uppercase tracking-[0.05em] text-[var(--verse-text)] md:text-4xl md:tracking-[0.06em] lg:text-5xl">
        MNKY LABZ
      </h1>
      <p className="font-verse-logo text-xs font-medium uppercase tracking-[0.25em] text-[var(--verse-text-muted)] md:text-sm md:tracking-[0.3em]">
        MNKY VERSE COMMAND CENTER
      </p>
    </div>
  );
}
