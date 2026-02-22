"use client"

import { BlurFade } from "@/components/ui/blur-fade"
import { Check } from "lucide-react"

export function MainCustomization() {
  return (
    <BlurFade delay={0.12} inView inViewMargin="-20px">
      <section
        className="max-w-3xl"
        style={{ marginTop: "var(--main-section-gap)" }}
      >
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Your scent, your vessel
        </h2>
        <p className="mt-4 text-muted-foreground">
          We believe fragrance should reflect who you are. In the Blending Lab
          you choose notes and ratios; we also offer container personalization—so
          your bottle is as unique as your blend.
        </p>
        <ul className="mt-6 space-y-3 text-muted-foreground">
          {[
            "Custom scent profiles built from our note library",
            "Bottle and cap options to match your style",
            "Labels and packaging that feel personal, not generic",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </BlurFade>
  )
}
