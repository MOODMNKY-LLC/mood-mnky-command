"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { VerseButton } from "@/components/verse/ui/button";
import { DottedMap } from "@/components/ui/dotted-map";
import { BrandMatrixText } from "@/components/main/elevenlabs/brand-matrix-text";
import { useVerseTheme } from "./verse-theme-provider";
import { useVerseUser } from "./verse-user-context";
import { useIsMobile } from "@/hooks/use-mobile";
import type { COBEOptions } from "cobe";

const MOBILE_BREAKPOINT = 768;

/** Skip WebGL Globe on iOS/iPadOS (iPhone + iPad) to avoid Safari context/cobe failures. */
function isIosOrIpad(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (ua.includes("Mac") && navigator.maxTouchPoints > 1) return true;
  return false;
}

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

/** Normalized RGB [0-1]. Light theme: original light globe. Dark theme: cobe dark=1 so baseColor is the lit-dot color (verse-text #c8c4c4). */
const VERSE_GLOBE = {
  /** Light theme: light globe (original appearance) */
  lightTheme: {
    baseColor: [0.96, 0.96, 0.97] as [number, number, number],
    markerColor: [0.3, 0.35, 0.4] as [number, number, number],
    glowColor: [0.6, 0.6, 0.65] as [number, number, number],
  },
  /** Dark theme: lit dots use project light blue (--status-ready 200 50% 55%). “lighting up” */
  darkTheme: {
    baseColor: [148 / 255, 163 / 255, 184 / 255] as [number, number, number],
    markerColor: [148 / 255, 163 / 255, 184 / 255] as [number, number, number],
    glowColor: [120 / 255, 135 / 255, 155 / 255] as [number, number, number],
  },
};

const GLOBE_BASE_LIGHT: Omit<COBEOptions, "baseColor" | "markerColor" | "glowColor"> = {
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
  markers: [],
};

/** Dark theme: cobe "dark" mode (dark=1) makes map dots bright and base dim; use light baseColor so dots read as lit. */
const GLOBE_BASE_DARK: Omit<COBEOptions, "baseColor" | "markerColor" | "glowColor"> = {
  ...GLOBE_BASE_LIGHT,
  dark: 1,
  mapBrightness: 9,
  mapBaseBrightness: 0,
};

/** Light theme → original light globe. Dark theme → dark base with light dots (locations “lighting up”). */
function getGlobeConfigForTheme(theme: "light" | "dark"): COBEOptions {
  const colors = theme === "dark" ? VERSE_GLOBE.darkTheme : VERSE_GLOBE.lightTheme;
  const base = theme === "dark" ? GLOBE_BASE_DARK : GLOBE_BASE_LIGHT;
  return {
    ...base,
    baseColor: colors.baseColor,
    markerColor: colors.markerColor,
    glowColor: colors.glowColor,
  };
}

const INTRO_COPY = `MNKY VERSE is your gateway to the universe of scents. Discover curated fragrances and collections designed to elevate mood and intention.`;

const WELCOME_BACK_COPY = `Your gateway to the universe of scents—curated fragrances, self-care rituals, and discovery await.`;

export function VerseHeroDynamic() {
  const { theme } = useVerseTheme();
  const user = useVerseUser();
  const isMobile = useIsMobile();
  const [showGlobe, setShowGlobe] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wideEnough = window.innerWidth >= MOBILE_BREAKPOINT;
    const notIos = !isIosOrIpad();
    setShowGlobe(wideEnough && notIos);
  }, []);

  const globeConfig = useMemo(() => getGlobeConfigForTheme(theme), [theme]);
  const name = user?.displayName || user?.email?.split("@")[0] || null;
  const isLoggedIn = Boolean(name);
  const mapSamples = isMobile ? 1500 : 4000;

  return (
    <section className="verse-hero-split mx-auto grid w-full max-w-[var(--verse-page-width)] grid-cols-1 grid-rows-1 items-end gap-6 overflow-hidden rounded-b-2xl px-4 pt-10 pb-6 md:grid-cols-[1fr_1fr] md:gap-12 md:px-6 md:pt-14 md:pb-10 lg:min-h-[548px]">
      {/* Left: Intro copy + CTAs - bottom-aligned; when logged in show welcome back + custom copy */}
      <div className="flex min-h-0 flex-col justify-end gap-4 md:gap-6">
        <div className="space-y-4">
          <h1 className="font-verse-heading text-2xl font-semibold tracking-tight text-verse-text md:text-3xl lg:text-4xl flex flex-wrap items-center gap-1">
            {isLoggedIn ? (
              <>
                Welcome back, <span className="font-semibold">{name}</span>
              </>
            ) : (
              <>
                Welcome to <BrandMatrixText variant="MNKY" size={4} gap={1} className="inline-block h-7 md:h-8" /> VERSE
              </>
            )}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-verse-text-muted md:text-lg">
            {isLoggedIn ? WELCOME_BACK_COPY : INTRO_COPY}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isLoggedIn ? (
            <>
              <VerseButton asChild size="lg">
                <Link href="/auth/login?next=/verse">Sign in</Link>
              </VerseButton>
              <VerseButton asChild variant="outline" size="lg">
                <Link href="/dojo">Visit your Dojo</Link>
              </VerseButton>
              <VerseButton asChild variant="outline" size="lg">
                <Link href="/verse/products">Shop Products</Link>
              </VerseButton>
              <VerseButton asChild variant="outline" size="lg">
                <Link href="/verse/collections">Browse Collections</Link>
              </VerseButton>
            </>
          ) : (
            <>
              <VerseButton asChild size="lg">
                <Link href="/verse/products">Shop Products</Link>
              </VerseButton>
              <VerseButton asChild variant="outline" size="lg">
                <Link href="/verse/collections">Browse Collections</Link>
              </VerseButton>
              <VerseButton asChild variant="outline" size="lg">
                <Link href="/dojo">Visit your Dojo</Link>
              </VerseButton>
            </>
          )}
        </div>
      </div>

      {/* Right: Dotted map background + Globe + mascot — min-height matches globe so top is not clipped */}
      <div className="relative flex min-h-[448px] md:min-h-[496px] lg:min-h-[548px]">
        {/* Layer 0: Dotted map - subtle background suggesting global reach */}
        <div className="absolute inset-0 z-0 flex items-end justify-center overflow-hidden opacity-[0.12] md:opacity-[0.15] dark:opacity-24 dark:md:opacity-[0.30]">
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
