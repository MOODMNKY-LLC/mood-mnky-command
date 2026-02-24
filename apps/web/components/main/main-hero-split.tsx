"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { useThemePalette } from "@/components/theme-palette-provider"
import { getGlobeConfigForTheme } from "@/components/verse/verse-hero-dynamic"
import { Button } from "@/components/ui/button"
import { BlurFade } from "@/components/ui/blur-fade"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS, MAIN_MASCOT_FALLBACK_HERO } from "@/lib/main-mascot-assets"
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern"
import { DottedMap } from "@/components/ui/dotted-map"
import { useIsMobile } from "@/hooks/use-mobile"
import { BrandMatrixText } from "@/components/main/elevenlabs/brand-matrix-text"
import { MainShimmeringText } from "@/components/main/elevenlabs/main-shimmering-text"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { cn } from "@/lib/utils"
import type { COBEOptions } from "cobe"

const MOBILE_BREAKPOINT = 768

/** Skip WebGL Globe on iOS/iPadOS to avoid Safari context/cobe failures. */
function isIosOrIpad(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  if (ua.includes("Mac") && navigator.maxTouchPoints > 1) return true
  return false
}

const Globe = dynamic(
  () => import("@/components/ui/globe").then((m) => ({ default: m.Globe })),
  {
    ssr: false,
    loading: () => (
      <div className="size-full rounded-full bg-foreground/5" aria-hidden />
    ),
  }
)

const GLOBE_PLACEHOLDER = (
  <div className="size-full rounded-full bg-foreground/5" aria-hidden />
)

/** Grayscale globe colors derived from Main theme (main-site.css). Light = bg 100%, fg 9%; dark = bg 6%, fg 98%. */
const MAIN_GLOBE = {
  light: {
    baseColor: [1, 1, 1] as [number, number, number],
    markerColor: [0.09, 0.09, 0.09] as [number, number, number],
    glowColor: [0.12, 0.12, 0.12] as [number, number, number],
  },
  dark: {
    baseColor: [0.06, 0.06, 0.06] as [number, number, number],
    markerColor: [0.98, 0.98, 0.98] as [number, number, number],
    glowColor: [0.98, 0.98, 0.98] as [number, number, number],
  },
}

const MAIN_GLOBE_BASE_LIGHT: Omit<
  COBEOptions,
  "baseColor" | "markerColor" | "glowColor"
> = {
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
}

const MAIN_GLOBE_BASE_DARK: Omit<
  COBEOptions,
  "baseColor" | "markerColor" | "glowColor"
> = {
  ...MAIN_GLOBE_BASE_LIGHT,
  dark: 1,
  mapBrightness: 9,
  mapBaseBrightness: 0,
}

function getMainGlobeConfig(theme: "light" | "dark" | undefined): COBEOptions {
  const t = theme === "dark" ? "dark" : "light"
  const colors = MAIN_GLOBE[t]
  const base = t === "dark" ? MAIN_GLOBE_BASE_DARK : MAIN_GLOBE_BASE_LIGHT
  return {
    ...base,
    baseColor: colors.baseColor,
    markerColor: colors.markerColor,
    glowColor: colors.glowColor,
  }
}

export function MainHeroSplit() {
  const { resolvedTheme } = useTheme()
  const { palette } = useThemePalette()
  const isMobile = useIsMobile()
  const [showGlobe, setShowGlobe] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    if (typeof window === "undefined") return
    const wideEnough = window.innerWidth >= MOBILE_BREAKPOINT
    const notIos = !isIosOrIpad()
    setShowGlobe(wideEnough && notIos)
  }, [])

  const theme = resolvedTheme === "dark" ? "dark" : "light"
  const globeConfig = useMemo(
    () =>
      palette === "dojo"
        ? getGlobeConfigForTheme(theme)
        : getMainGlobeConfig(resolvedTheme ?? "light"),
    [palette, theme, resolvedTheme]
  )
  const mapSamples = isMobile ? 1500 : 4000

  return (
    <BlurFade delay={0.05} inView inViewMargin="-20px">
      <section className="relative grid min-h-[70vh] grid-cols-1 items-center gap-12 overflow-hidden bg-background py-16 md:grid-cols-2 md:gap-16 md:py-24">
        {/* Background: Interactive Grid (grayscale) – full hero */}
        <div className="pointer-events-none absolute inset-0">
          <InteractiveGridPattern
            className={cn(
              "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
              "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 border-0"
            )}
            width={32}
            height={32}
            squares={[24, 24]}
            squaresClassName="stroke-gray-400/20 hover:fill-gray-500/15"
          />
        </div>

        {/* Left: Copy + CTAs */}
        <div className="relative z-10 flex flex-col justify-center">
          <h1
            className="font-bold tracking-tight text-foreground"
            style={{ fontSize: "var(--main-hero-title-size)" }}
          >
            Bespoke experiences.
            <br />
            Your story, your scent.
          </h1>
          <div
            role="paragraph"
            className="mt-4 max-w-lg text-muted-foreground"
            style={{ fontSize: "var(--main-hero-subtitle-size)" }}
          >
            Extreme personalization, sensory journeys, and handcrafted blends.{" "}
            Always scentsing the{" "}
            <BrandMatrixText variant="MOOD" size={3} gap={0.5} className="mx-0.5 inline-block h-5 align-baseline md:h-6" />
            .
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg" className="main-btn-float">
              <Link href="/verse">Shop the store</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="main-btn-glass">
              <Link href="/verse/blending-guide">Customize your scent</Link>
            </Button>
            <button
              type="button"
              className="main-btn-float inline-flex h-12 items-center justify-center gap-2 px-4 text-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Talk to MOOD MNKY"
              onClick={() =>
                document.getElementById("voice-block")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <VerseLogoHairIcon
                withRing
                size="md"
                className="shrink-0 text-foreground"
                ringClassName="border-foreground/80"
              />
              <MainShimmeringText
                text="Talk to MOOD MNKY"
                duration={2.5}
                repeat
                repeatDelay={0.5}
                startOnView
                once={false}
                className="whitespace-nowrap text-lg"
              />
            </button>
          </div>
        </div>

        {/* Right: Dotted Map + Globe + mascot (layered, no card) */}
        <div className="relative z-10 flex min-h-[448px] md:min-h-[496px] lg:min-h-[548px]">
          {/* Layer 0: Dotted map */}
          <div className="absolute inset-0 z-0 flex items-end justify-center overflow-hidden opacity-[0.12] md:opacity-[0.15] dark:opacity-24 dark:md:opacity-[0.30]">
            <div className="relative h-full w-full min-h-[280px] min-w-[320px]">
              <DottedMap
                width={200}
                height={100}
                mapSamples={mapSamples}
                dotRadius={0.15}
                dotColor="currentColor"
                className="h-full w-full text-foreground"
              />
            </div>
          </div>
          {/* Layer 1: Globe */}
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
          {/* Layer 2: Mascot – bottom-left in front of globe (same layout as verse hero) */}
          <div
            className="absolute bottom-0 left-0 z-20 flex items-end pl-1 md:pl-2"
            style={
              mounted && theme === "dark"
                ? { filter: "drop-shadow(0 0 64px rgba(0,0,0,0.5))" }
                : { filter: "drop-shadow(0 0 64px rgba(255,255,255,0.35))" }
            }
          >
            <div className="relative h-[280px] w-[304px] shrink-0 md:h-[320px] md:w-[368px] lg:h-[360px] lg:w-[432px]">
              <MainMascotImage
                src={MAIN_MASCOT_FALLBACK_HERO}
                fallbackSrc={MAIN_MASCOT_ASSETS.hero}
                alt="MOOD MNKY – Bespoke experiences"
                fill
                className="object-contain object-bottom"
                priority
                sizes="(max-width: 768px) 304px, (max-width: 1024px) 368px, 432px"
              />
            </div>
          </div>
        </div>
      </section>
    </BlurFade>
  )
}
