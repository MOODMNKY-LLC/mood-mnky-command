"use client";

import dynamic from "next/dynamic";

export const HeroModelDynamic = dynamic(
  () => import("@/components/hero-model").then((m) => m.HeroModel),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl w-full aspect-square min-h-[200px] flex items-center justify-center bg-muted/30">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    ),
  }
);
