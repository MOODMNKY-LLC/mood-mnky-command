"use client";

import { cn } from "@/lib/utils";

/**
 * Auth page logo block for MNKY LABZ: MNKY LABZ (primary) → Manage your product lab (tagline)
 * Light-mode focused: dark text (gray-900/600) for contrast on bright background.
 */
export function AuthLabzLogoBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-center",
        className
      )}
    >
      <h1 className="whitespace-nowrap font-verse-logo text-3xl font-black uppercase tracking-[0.05em] text-gray-900 md:text-4xl md:tracking-[0.06em] lg:text-5xl">
        MNKY LABZ
      </h1>
      <p className="font-verse-logo text-xs font-medium uppercase tracking-[0.25em] text-gray-600 md:text-sm md:tracking-[0.3em]">
        Manage your product lab
      </p>
    </div>
  );
}
