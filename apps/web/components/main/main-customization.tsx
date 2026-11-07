"use client"

import Link from "next/link"
import { BlurFade } from "@/components/ui/blur-fade"
import { Check } from "lucide-react"
import { MainMascotImage } from "./main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"

export function MainCustomization() {
  return (
    <BlurFade delay={0.12} inView inViewMargin="-20px">
      <section
        className="grid gap-8 lg:grid-cols-2 lg:items-center"
        style={{ marginTop: "var(--main-section-gap)" }}
      >
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Your scent, your vessel
          </h2>
          <p className="mt-4 text-muted-foreground">
            We believe fragrance should reflect who you are. In the Blending Lab
            you choose notes and ratios; we also offer container
            personalization—so your bottle is as unique as your blend.
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
          <p className="mt-6 text-sm text-muted-foreground">
            <Link
              href="/dojo/blending-guide"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Read the blending guide
            </Link>
            {" · "}
            <Link
              href="/main/collections/fragrances"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Fragrance collection
            </Link>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
            <MainMascotImage
              src={MAIN_MASCOT_ASSETS.fragrances}
              alt="MOOD MNKY fragrance library artwork"
              fill
              sizes="(max-width: 640px) 100vw, 40vw"
              className="object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-xs text-white">
              Scent library
            </figcaption>
          </figure>
          <figure className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
            <MainMascotImage
              src={MAIN_MASCOT_ASSETS.collections}
              alt="MOOD MNKY vessel and collections artwork"
              fill
              sizes="(max-width: 640px) 100vw, 40vw"
              className="object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-xs text-white">
              Vessel & collections
            </figcaption>
          </figure>
        </div>
      </section>
    </BlurFade>
  )
}
