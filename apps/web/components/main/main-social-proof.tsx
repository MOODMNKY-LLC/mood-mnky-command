"use client"

import { BlurFade } from "@/components/ui/blur-fade"
import type { MainLandingSocialProofItem } from "@/lib/main-landing-data"


const STATS_FALLBACK: MainLandingSocialProofItem[] = [
  { id: "1", value: "50+", label: "Scents & notes", sort_order: 0 },
  { id: "2", value: "Bespoke", label: "Blends", sort_order: 1 },
  { id: "3", value: "Handcrafted", label: "In-house", sort_order: 2 },
]

export function MainSocialProof({
  items,
}: {
  items?: MainLandingSocialProofItem[] | null
}) {
  const stats = items != null && items.length > 0 ? items : STATS_FALLBACK
  return (
    <BlurFade delay={0.1} inView inViewMargin="-20px">
      <section
        className="border-t border-border py-12"
        style={{ marginTop: "var(--main-section-gap)" }}
      >
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by creators & scent enthusiasts
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
          {stats.map(({ id, value, label }, i) => (
            <BlurFade
              key={id}
              delay={0.08 + i * 0.06}
              inView
              inViewMargin="-20px"
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {value}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>
    </BlurFade>
  )
}
