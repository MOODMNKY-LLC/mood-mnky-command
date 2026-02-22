"use client"

import {
  Sparkles,
  Palette,
  Gem,
  FlaskConical,
  Beaker,
  Bot,
  type LucideIcon,
} from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { MainGlassCard } from "./main-glass-card"
import type { MainLandingFeatureItem } from "@/lib/main-landing-data"

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Palette,
  Gem,
  Beaker,
  FlaskConical,
  Bot,
}

const FEATURES_FALLBACK: MainLandingFeatureItem[] = [
  { id: "1", icon_name: "Sparkles", title: "Extreme Personalization", description: "Scents tailored to your mood, story, and preferences. No two blends alike.", sort_order: 0 },
  { id: "2", icon_name: "Palette", title: "Sensory Journeys", description: "Explore fragrance families and discover how scent shapes experience.", sort_order: 1 },
  { id: "3", icon_name: "Gem", title: "Handcrafted", description: "Small-batch, artisanal blends made with care and premium ingredients.", sort_order: 2 },
  { id: "4", icon_name: "Beaker", title: "The Dojo", description: "Learn the craft. Master notes, accords, and the art of blending.", sort_order: 3 },
  { id: "5", icon_name: "FlaskConical", title: "Blending Lab", description: "Create your own scent in the Lab—notes, ratios, and a bottle that's yours.", sort_order: 4 },
  { id: "6", icon_name: "Bot", title: "AI Companions", description: "MOOD MNKY and friends guide you through discovery and customization.", sort_order: 5 },
]

export function MainFeatureCards({
  items,
}: {
  items?: MainLandingFeatureItem[] | null
}) {
  const features =
    items != null && items.length > 0 ? items : FEATURES_FALLBACK
  return (
    <section
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      style={{ marginTop: "var(--main-section-gap)" }}
    >
      {features.map(({ id, icon_name, title, description }, i) => {
        const Icon = ICON_MAP[icon_name] ?? Sparkles
        return (
          <BlurFade
            key={id}
            delay={0.06 + i * 0.04}
            inView
            inViewMargin="-20px"
          >
            <MainGlassCard className="main-float main-glass-panel-card flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/80 text-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold tracking-tight text-foreground">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </MainGlassCard>
          </BlurFade>
        )
      })}
    </section>
  )
}
