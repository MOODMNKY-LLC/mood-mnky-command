"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  MessageCircle,
  ShoppingBag,
  Gift,
  FlaskConical,
} from "lucide-react";
import { VerseButton } from "@/components/verse/ui/button";
import { Globe } from "@/components/ui/globe";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { DottedMap } from "@/components/ui/dotted-map";
import { useVerseTheme } from "./verse-theme-provider";
import type { COBEOptions } from "cobe";
import { cn } from "@/lib/utils";

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

const ORBIT_ICON_STYLE =
  "flex size-full items-center justify-center rounded-full bg-verse-button/80 p-2 text-verse-button-text transition-opacity hover:opacity-100 hover:bg-verse-button";

export function VerseHeroDynamic() {
  const { theme } = useVerseTheme();
  const globeConfig = theme === "dark" ? GLOBE_CONFIG_DARK : GLOBE_CONFIG_LIGHT;

  return (
    <section className="verse-hero-split mx-auto grid w-full max-w-[var(--verse-page-width)] grid-cols-1 grid-rows-1 items-end gap-6 overflow-hidden rounded-b-2xl px-4 py-6 md:grid-cols-[1fr_1fr] md:gap-12 md:px-6 md:py-10 lg:min-h-[480px]">
      {/* Left: Intro copy + CTAs - bottom-aligned, floor position with mascot */}
      <div className="flex min-h-0 flex-col justify-end gap-4 md:gap-6">
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

      {/* Right: Dotted map background + Globe + mascot + orbiting circles */}
      <div className="relative flex min-h-[280px] md:min-h-[360px] lg:min-h-[420px]">
        {/* Layer 0: Dotted map - subtle background suggesting global reach */}
        <div className="absolute inset-0 z-0 flex items-end justify-center overflow-hidden opacity-[0.12] md:opacity-[0.15]">
          <div className="relative h-full w-full min-h-[280px] min-w-[320px]">
            <DottedMap
              width={200}
              height={100}
              mapSamples={4000}
              dotRadius={0.15}
              dotColor="currentColor"
              className="h-full w-full text-verse-text"
            />
          </div>
        </div>
        {/* Shared container: globe and orbit use SAME frame for perfect concentric alignment */}
        <div className="absolute inset-0 z-0 flex items-end justify-center">
          <div className="relative h-[360px] w-[360px] shrink-0 md:h-[400px] md:w-[400px] lg:h-[440px] lg:w-[440px]">
            {/* Layer 1: Globe - fills container */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <Globe
                config={globeConfig}
                className="size-full max-h-none max-w-none opacity-40 md:opacity-50 [contain:layout_paint]"
              />
            </div>
            {/* Layer 2: Orbit - same container, radius = half for circumference match */}
            <div className="absolute inset-0 motion-reduce:[&_[class*='animate-orbit']]:animate-none [&>div]:pointer-events-auto">
              <OrbitingCircles
                radius={180}
                iconSize={36}
                speed={1.2}
                duration={20}
                path={true}
                className="[&_circle]:stroke-verse-text/10"
              >
              <Link
                href="/verse/fragrance-wheel"
                className={ORBIT_ICON_STYLE}
                aria-label="Discover scent families"
              >
                <Sparkles className="size-5" />
              </Link>
              <Link
                href="/verse/explore"
                className={ORBIT_ICON_STYLE}
                aria-label="Explore fragrances"
              >
                <BookOpen className="size-5" />
              </Link>
              <Link
                href="/verse/chat"
                className={ORBIT_ICON_STYLE}
                aria-label="Chat with AI"
              >
                <MessageCircle className="size-5" />
              </Link>
              <Link
                href="/verse/products"
                className={ORBIT_ICON_STYLE}
                aria-label="Shop products"
              >
                <ShoppingBag className="size-5" />
              </Link>
            </OrbitingCircles>
            </div>
            {/* Inner orbit - reverse, proportional */}
            <div className="absolute inset-0 motion-reduce:[&_[class*='animate-orbit']]:animate-none [&>div]:pointer-events-auto">
              <OrbitingCircles
                radius={105}
                iconSize={32}
                speed={2}
                duration={15}
                reverse
                path={false}
              >
                <Link
                  href="/verse/blending-guide"
                  className={ORBIT_ICON_STYLE}
                  aria-label="Blending guide"
                >
                  <FlaskConical className="size-4" />
                </Link>
                <Link
                  href="/verse/collections"
                  className={ORBIT_ICON_STYLE}
                  aria-label="Collections"
                >
                  <Gift className="size-4" />
                </Link>
              </OrbitingCircles>
            </div>
          </div>
        </div>

        {/* Layer 3: Mascot - bottom-left of globe, overlapping left flank (foreground) */}
        <div className="absolute bottom-0 left-0 z-20 flex items-end pl-1 md:pl-2">
          <Image
            src="/verse/mood_mnky.png"
            alt="MOOD MNKY - Your gateway to the universe"
            width={720}
            height={810}
            className="h-auto w-full max-w-[380px] object-contain object-bottom md:max-w-[460px] lg:max-w-[540px]"
            style={
              theme === "dark"
                ? {
                    filter: "drop-shadow(0 0 64px rgba(0,0,0,0.5))",
                  }
                : {
                    filter: "drop-shadow(0 0 64px rgba(255,255,255,0.35))",
                  }
            }
            sizes="(max-width: 768px) 380px, (max-width: 1024px) 460px, 540px"
            priority
          />
        </div>
      </div>
    </section>
  );
}
