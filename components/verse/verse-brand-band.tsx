"use client";

import { VerseLogoBlock } from "./verse-logo-block";
import { useVerseTheme } from "./verse-theme-provider";
import { cn } from "@/lib/utils";

/** Full-width opposite-color brand band at the fold; creates visual break, features logo prominently */
export function VerseBrandBand() {
  const { theme } = useVerseTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={cn(
        "verse-brand-band flex w-full items-center justify-center py-4 md:py-6",
        isDark
          ? "border-y border-slate-400/20 bg-slate-100 text-slate-900"
          : "border-y border-white/10 bg-slate-900 text-slate-100"
      )}
      aria-hidden
    >
      <VerseLogoBlock variant="band" primaryText="MNKY VERSE" />
    </section>
  );
}
