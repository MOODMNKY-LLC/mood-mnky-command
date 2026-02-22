"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BlurFade } from "@/components/ui/blur-fade"
import { MainShimmeringText } from "@/components/main/elevenlabs/main-shimmering-text"

export function MainHeroSplit() {
  return (
    <BlurFade delay={0.05} inView inViewMargin="-20px">
      <section className="grid min-h-[70vh] grid-cols-1 items-center gap-12 py-16 md:grid-cols-2 md:gap-16 md:py-24">
        <div className="flex flex-col justify-center">
          <h1
            className="font-bold tracking-tight text-foreground"
            style={{ fontSize: "var(--main-hero-title-size)" }}
          >
            Bespoke fragrance.
            <br />
            Your story, your scent.
          </h1>
          <p
            className="mt-4 max-w-lg text-muted-foreground"
            style={{ fontSize: "var(--main-hero-subtitle-size)" }}
          >
            Extreme personalization, sensory journeys, and handcrafted blends.{" "}
            <MainShimmeringText text="Always scentsing the MOOD." duration={2.5} once />
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/verse">Shop the VERSE</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/verse/blending-guide">Customize your scent</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/30 md:min-h-[320px]">
          <Image
            src="/verse/mood-mnky-3d.png"
            alt="MOOD MNKY – Bespoke fragrance"
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>
    </BlurFade>
  )
}
