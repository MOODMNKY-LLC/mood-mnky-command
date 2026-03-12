"use client";

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Auth page logo block for MNKY LABZ: Beaker icon (LABZ) → MNKY LABZ (primary) → MNKY VERSE COMMAND CENTER (tagline)
 * Uses verse tokens for theme-aware contrast. Beaker matches Verse flame icon sizing for alignment when switching tabs.
 */
export function AuthLabzLogoBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-start gap-1 text-center text-[var(--verse-text)]",
        className
      )}
    >
      {/* Beaker icon - LABZ counterpart to Verse flame (same distance from text as AuthLogoHair) */}
      <div
        className="-mb-1 flex h-[104px] w-20 items-end justify-center md:h-[128px] md:w-24 lg:h-[160px] lg:w-32 shrink-0 pb-0"
        aria-hidden
      >
        <FlaskConical
          className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 text-[var(--verse-text)]"
          strokeWidth={1.5}
        />
      </div>
      <h1 className="whitespace-nowrap font-verse-logo text-3xl font-black uppercase tracking-[0.05em] text-[var(--verse-text)] md:text-4xl md:tracking-[0.06em] lg:text-5xl">
        MNKY LABZ
      </h1>
      <p className="font-verse-logo text-xs font-medium uppercase tracking-[0.25em] text-[var(--verse-text-muted)] md:text-sm md:tracking-[0.3em]">
        MNKY VERSE COMMAND CENTER
      </p>
    </div>
  );
}
