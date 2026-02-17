"use client";

import Image from "next/image";
import Link from "next/link";
import { VerseButton } from "@/components/verse/ui/button";
import { Globe } from "@/components/ui/globe";
import { useVerseTheme } from "./verse-theme-provider";
import type { COBEOptions } from "cobe";

const GLOBE_CONFIG_LIGHT: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [0.96, 0.96, 0.97],
  markerColor: [0.3, 0.35, 0.4],
  glowColor: [0.6, 0.6, 0.65],
  markers: [],
};

const GLOBE_CONFIG_DARK: COBEOptions = {
  ...GLOBE_CONFIG_LIGHT,
  baseColor: [0.06, 0.06, 0.08],
  markerColor: [0.6, 0.63, 0.7],
  glowColor: [0.4, 0.4, 0.45],
};

const INTRO_COPY = `MNKY VERSE is your gateway to the universe of scents. Discover curated fragrances and collections designed to elevate mood and intention.`;

export function VerseHero() {
  const { theme } = useVerseTheme();
  const globeConfig = theme === "dark" ? GLOBE_CONFIG_DARK : GLOBE_CONFIG_LIGHT;

  return (
    <section className="verse-hero-split mx-auto grid w-full max-w-[var(--verse-page-width)] grid-cols-1 gap-6 overflow-hidden rounded-b-2xl px-4 py-8 md:grid-cols-[1fr_1fr] md:gap-12 md:px-6 md:py-14 lg:min-h-[560px]">
      {/* Left: Intro copy + CTAs (50%) */}
      <div className="flex flex-col justify-center gap-6 md:gap-8">
        <div className="space-y-4">
          <h1 className="font-verse-heading text-2xl font-semibold tracking-tight text-verse-text md:text-3xl lg:text-4xl">
            Welcome to MNKY VERSE
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-verse-text-muted md:text-lg">
            {INTRO_COPY}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <VerseButton asChild size="lg">
            <Link href="/verse/products">Shop Products</Link>
          </VerseButton>
          <VerseButton asChild variant="outline" size="lg">
            <Link href="/verse/collections">Browse Collections</Link>
          </VerseButton>
        </div>
      </div>
      {/* Right: Globe + mascot (50% of hero, very prominently featured) */}
      <div className="relative flex min-h-[320px] items-center justify-center md:min-h-[450px] lg:min-h-[520px]">
        <div className="absolute flex h-full w-full items-center justify-center">
          <Globe
            config={globeConfig}
            className="aspect-square max-h-[340px] max-w-[340px] opacity-35 md:max-h-[460px] md:max-w-[460px] md:opacity-40 lg:max-h-[520px] lg:max-w-[520px]"
          />
        </div>
        <div className="relative z-10 flex h-full items-center justify-center">
          <Image
            src="/verse/mood-mnky-3d.png"
            alt="MOOD MNKY - Your gateway to the universe"
            width={360}
            height={400}
            className="h-auto w-[70%] max-w-[220px] object-contain md:max-w-[340px] lg:max-w-[420px]"
            unoptimized
            style={
              theme === "dark"
                ? {
                    filter: "drop-shadow(0 0 56px rgba(0,0,0,0.45))",
                  }
                : {
                    filter: "drop-shadow(0 0 56px rgba(255,255,255,0.25))",
                  }
            }
            sizes="(max-width: 768px) 220px, (max-width: 1024px) 340px, 420px"
            priority
          />
        </div>
      </div>
    </section>
  );
}
