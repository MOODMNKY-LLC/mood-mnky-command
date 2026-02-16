"use client";

import { cn } from "@/lib/utils";
import { VerseLogoFlame } from "./verse-logo-flame";

/**
 * Centered logo block matching reference proportions:
 * Flame (centered) → MNKY VERSE (primary) → SCENTS THE MOOD (tagline)
 * Flame height ~ primary text cap height; wide tracking on both lines.
 */
export function VerseLogoBlock({
  variant = "primary",
  primaryText = "MNKY VERSE",
  className,
}: {
  variant?: "primary" | "background" | "band";
  primaryText?: string;
  className?: string;
}) {
  const isBg = variant === "background";
  const isBand = variant === "band";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isBg ? "gap-0 opacity-[0.22]" : isBand ? "gap-0" : "gap-1",
        className
      )}
    >
      <VerseLogoFlame
        className={cn(
          "h-auto",
          isBg
            ? "-mb-1 max-h-[220px] w-44 md:-mb-1.5 md:max-h-[320px] md:w-64 lg:max-h-[420px] lg:w-80 xl:max-h-[520px] xl:w-96"
            : isBand
              ? "-mb-0.5 max-h-[105px] w-[84px] text-current md:max-h-[135px] md:w-[108px] lg:max-h-[165px] lg:w-[132px]"
              : "max-h-[64px] w-12 md:max-h-[80px] md:w-14"
        )}
      />
      <h1
        className={cn(
          "font-verse-logo font-black uppercase",
          isBg
            ? "text-4xl tracking-[0.06em] text-verse-text md:text-6xl md:tracking-[0.08em] lg:text-7xl xl:text-8xl 2xl:text-9xl"
            : isBand
              ? "text-xl tracking-[0.08em] text-current md:text-2xl lg:text-3xl"
              : "text-2xl tracking-[0.15em] text-verse-text md:text-3xl md:tracking-[0.2em] lg:text-4xl"
        )}
      >
        {primaryText}
      </h1>
      <p
        className={cn(
          "font-verse-logo font-medium uppercase",
          isBg
            ? "mt-0.5 text-lg tracking-[0.18em] text-verse-text-muted md:text-2xl md:tracking-[0.2em] lg:text-3xl xl:text-4xl 2xl:text-5xl"
            : isBand
              ? "mt-0.5 text-xs tracking-[0.18em] text-current/75 md:text-sm lg:text-base"
              : "text-sm tracking-[0.25em] text-verse-text-muted md:text-base md:tracking-[0.3em]"
        )}
      >
        SCENTS THE MOOD
      </p>
    </div>
  );
}
