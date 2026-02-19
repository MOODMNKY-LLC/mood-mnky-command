"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { VerseButton } from "@/components/verse/ui/button";
import { DottedMap } from "@/components/ui/dotted-map";
import { useVerseTheme } from "./verse-theme-provider";
import { useVerseUser } from "./verse-user-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import type { COBEOptions } from "cobe";

type ShopifyConnection = {
  linked: boolean;
  needsReconnect?: boolean;
  email?: string;
};

const shopifyConnectionFetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<ShopifyConnection>;

function getStoreAccountUrl(): string | undefined {
  const domain =
    process.env.NEXT_PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;
  if (!domain?.trim()) return undefined;
  return `https://${domain.trim()}/account`;
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showGlobe, setShowGlobe] = useState(false);
  const [showLinkSuccess, setShowLinkSuccess] = useState(false);

  const shopifyJustLinked = searchParams.get("shopify") === "linked";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wideEnough = window.innerWidth >= MOBILE_BREAKPOINT;
    const notIos = !isIosOrIpad();
    setShowGlobe(wideEnough && notIos);
  }, []);

  useEffect(() => {
    if (!shopifyJustLinked) return;
    setShowLinkSuccess(true);
    globalMutate("/api/customer-account-api/connection");
    const t = setTimeout(() => {
      setShowLinkSuccess(false);
      const url = new URL(window.location.href);
      url.searchParams.delete("shopify");
      router.replace(url.pathname + url.search);
    }, 5000);
    return () => clearTimeout(t);
  }, [shopifyJustLinked, router]);

  const globeConfig = useMemo(
    () => (theme === "dark" ? GLOBE_CONFIG_DARK : GLOBE_CONFIG_LIGHT),
    [theme]
  );
  const name = user?.displayName || user?.email?.split("@")[0] || null;
  const isLoggedIn = Boolean(name);
  const { data: shopifyConnection } = useSWR<ShopifyConnection>(
    isLoggedIn ? "/api/customer-account-api/connection" : null,
    shopifyConnectionFetcher
  );
  const shopifyLinked =
    (shopifyConnection?.linked ?? false) || shopifyJustLinked;
  const needsReconnect = shopifyConnection?.needsReconnect ?? false;
  const shopifyEmail = shopifyConnection?.email;
  const storeAccountUrl = getStoreAccountUrl();
  const mapSamples = isMobile ? 1500 : 4000;

  return (
    <section className="verse-hero-split mx-auto grid w-full max-w-[var(--verse-page-width)] grid-cols-1 grid-rows-1 items-end gap-6 overflow-hidden rounded-b-2xl px-4 pt-10 pb-6 md:grid-cols-[1fr_1fr] md:gap-12 md:px-6 md:pt-14 md:pb-10 lg:min-h-[548px]">
      {/* Left: Intro copy + CTAs - bottom-aligned; when logged in show welcome back + custom copy */}
      <div className="flex min-h-0 flex-col justify-end gap-4 md:gap-6">
        {showLinkSuccess && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/15 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-200 shadow-[0_0_20px_rgba(34,197,94,0.25)]">
            Shopify account linked. You’re all set.
          </div>
        )}
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
          {!isLoggedIn ? (
            <>
              <VerseButton asChild size="lg">
                <Link href="/auth/login?next=/verse&linkShopify=1">
                  Link Shopify account
                </Link>
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
              {shopifyLinked ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-shadow ${showLinkSuccess ? "border-green-500/60 bg-green-500/25 text-green-800 dark:text-green-200 shadow-[0_0_20px_rgba(34,197,94,0.5)]" : "border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.35)]"}`}
                      aria-label="Shopify linked – view details"
                    >
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Verified</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 border-verse-text/15 bg-verse-bg/95 text-verse-text"
                    align="start"
                  >
                    <div className="space-y-3">
                      {shopifyEmail && (
                        <p className="text-sm text-verse-text-muted">
                          Linked as {shopifyEmail}
                        </p>
                      )}
                      <div className="flex flex-col gap-1.5">
                        {storeAccountUrl && (
                          <a
                            href={storeAccountUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-verse-text hover:underline"
                          >
                            View orders
                          </a>
                        )}
                        <Link
                          href="/dojo"
                          className="text-sm font-medium text-verse-text hover:underline"
                        >
                          Rewards status
                        </Link>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : needsReconnect ? (
                <a href="/api/customer-account-api/auth">
                  <Badge
                    variant="secondary"
                    className="border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/25"
                  >
                    Reconnect
                  </Badge>
                </a>
              ) : (
                <VerseButton asChild variant="outline" size="lg">
                  <a href="/api/customer-account-api/auth">
                    Link your Shopify account for perks
                  </a>
                </VerseButton>
              )}
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
