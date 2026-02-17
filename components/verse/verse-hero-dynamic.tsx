"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { VerseButton } from "@/components/verse/ui/button";
import { DottedMap } from "@/components/ui/dotted-map";
import { useVerseTheme } from "./verse-theme-provider";
import { useVerseUser } from "./verse-user-context";
import { useIsMobile } from "@/hooks/use-mobile";
import type { COBEOptions } from "cobe";

const MOBILE_BREAKPOINT = 768;

const Globe = dynamic(
  () => import("@/components/ui/globe").then((m) => ({ default: m.Globe })),
  {
    ssr: false,
    loading: () => (
      <div className="size-full rounded-full bg-verse-text/5" aria-hidden />
    ),
  }
);

const GLOBE_PLACEHOLDER = (
  <div className="size-full rounded-full bg-verse-text/5" aria-hidden />
);

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

const WELCOME_BACK_COPY = `Your gateway to the universe of scents—curated fragrances, self-care rituals, and discovery await.`;

export function VerseHeroDynamic() {
  const { theme } = useVerseTheme();
  const user = useVerseUser();
  const isMobile = useIsMobile();
  const [showGlobe, setShowGlobe] = useState(false);
  useEffect(() => {
    const isNarrow =
      typeof window !== "undefined" &&
      window.innerWidth >= MOBILE_BREAKPOINT;
    setShowGlobe(isNarrow);
  }, []);
  const globeConfig = useMemo(
    () => (theme === "dark" ? GLOBE_CONFIG_DARK : GLOBE_CONFIG_LIGHT),
    [theme]
  );
  const name = user?.displayName || user?.email?.split("@")[0] || null;
  const isLoggedIn = Boolean(name);
  const mapSamples = isMobile ? 1500 : 4000;

  return (
    <section className="verse-hero-split mx-auto grid w-full max-w-[var(--verse-page-width)] grid-cols-1 grid-rows-1 items-end gap-6 overflow-hidden rounded-b-2xl px-4 pt-10 pb-6 md:grid-cols-[1fr_1fr] md:gap-12 md:px-6 md:pt-14 md:pb-10 lg:min-h-[548px]">
      {/* Left: Intro copy + CTAs - bottom-aligned; when logged in show welcome back + custom copy */}
      <div className="flex min-h-0 flex-col justify-end gap-4 md:gap-6">
        <div className="space-y-4">
          <h1 className="font-verse-heading text-2xl font-semibold tracking-tight text-verse-text md:text-3xl lg:text-4xl">
            {isLoggedIn ? (
              <>
                Welcome back, <span className="font-semibold">{name}</span>
              </>
            ) : (
              "Welcome to MNKY VERSE"
            )}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-verse-text-muted md:text-lg">
            {isLoggedIn ? WELCOME_BACK_COPY : INTRO_COPY}
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

      {/* Right: Dotted map background + Globe + mascot — min-height matches globe so top is not clipped */}
      <div className="relative flex min-h-[448px] md:min-h-[496px] lg:min-h-[548px]">
        {/* Layer 0: Dotted map - subtle background suggesting global reach */}
        <div className="absolute inset-0 z-0 flex items-end justify-center overflow-hidden opacity-[0.12] md:opacity-[0.15]">
          <div className="relative h-full w-full min-h-[280px] min-w-[320px]">
            <DottedMap
              width={200}
              height={100}
              mapSamples={mapSamples}
              dotRadius={0.15}
              dotColor="currentColor"
              className="h-full w-full text-verse-text"
            />
          </div>
        </div>
        {/* Globe container: skip WebGL Globe on mobile to avoid iOS Safari context/cobe failures */}
        <div className="absolute inset-0 z-0 flex items-end justify-center">
          <div className="relative h-[448px] w-[448px] shrink-0 md:h-[496px] md:w-[496px] lg:h-[548px] lg:w-[548px]">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              {showGlobe ? (
                <Globe
                  config={globeConfig}
                  className="size-full max-h-none max-w-none opacity-40 md:opacity-50 [contain:layout_paint]"
                />
              ) : (
                GLOBE_PLACEHOLDER
              )}
            </div>
          </div>
        </div>

        {/* Mascot - bottom-left of globe, overlapping left flank (foreground) */}
        <div className="absolute bottom-0 left-0 z-20 flex items-end pl-1 md:pl-2">
          <Image
            src="/verse/mood-mnky-3d.png"
            alt="MOOD MNKY - Your gateway to the universe"
            width={720}
            height={810}
            className="h-auto w-full max-w-[304px] object-contain object-bottom md:max-w-[368px] lg:max-w-[432px]"
            unoptimized
            style={
              theme === "dark"
                ? {
                    filter: "drop-shadow(0 0 64px rgba(0,0,0,0.5))",
                  }
                : {
                    filter: "drop-shadow(0 0 64px rgba(255,255,255,0.35))",
                  }
            }
            sizes="(max-width: 768px) 304px, (max-width: 1024px) 368px, 432px"
            priority
          />
        </div>
      </div>
    </section>
  );
}
