"use client";

import { VerseLogoBlock } from "./verse-logo-block";
import { useVerseTheme } from "./verse-theme-provider";
import { cn } from "@/lib/utils";

/** Full-width brand band at the fold. Dark mode: lighter banner (verse-text), darker logo scene (verse-bg). Light: opposite-color strip. */
export function VerseBrandBand() {
  const { theme } = useVerseTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={cn(
        "verse-brand-band flex w-full items-center justify-center py-2 md:py-3",
        isDark
          ? "border-y border-[var(--verse-border)] bg-[var(--verse-text)] text-[var(--verse-bg)]"
          : "border-y border-[var(--verse-border)] bg-[var(--verse-text)] text-[var(--verse-bg)]"
      )}
      aria-hidden
    >
      <VerseLogoBlock variant="band" primaryText="MNKY DOJO" />
    </section>
  );
}
