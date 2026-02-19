"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { DualAuthTabs, type AuthTab } from "@/components/auth/dual-auth-tabs"
import { AuthVerseLogoBlock } from "@/components/auth/auth-verse-logo-block"
import { AuthLabzLogoBlock } from "@/components/auth/auth-labz-logo-block"
import { BlurFade } from "@/components/ui/blur-fade"
import { DottedMap } from "@/components/ui/dotted-map"

const VERSE_BG_DARK = "/auth/mnky-verse-bg-dark.png"
const VERSE_BG_LIGHT = "/auth/mnky-verse-bg-light.png"
const MASCOT_VERSE = "/verse/mood-mnky-3d.png"
const MASCOT_LABZ = "/verse/code-mnky-3d.png"

const SHOPIFY_LINK_ERRORS = [
  "shopify_auth_failed",
  "missing_params",
  "config",
  "invalid_state",
  "token_exchange_failed",
  "storage_failed",
  "callback_failed",
]

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<AuthTab>("verse")
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  const next = searchParams.get("next")
  const linkShopify = searchParams.get("linkShopify") === "1"
  const error = searchParams.get("error")

  const verseRedirectTo = useMemo(() => {
    if (linkShopify) return "/api/customer-account-api/auth"
    if (next?.startsWith("/")) return next
    return "/verse"
  }, [linkShopify, next])

  const showShopifyLinkHint = Boolean(error && SHOPIFY_LINK_ERRORS.includes(error))

  useEffect(() => setMounted(true), [])

  const isDark = !mounted ? true : (resolvedTheme ?? "dark") === "dark"
  const verseBg = isDark ? VERSE_BG_DARK : VERSE_BG_LIGHT

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Dynamic background - both tabs use branded bg; LABZ adds Dotted Map overlay */}
      {activeTab === "verse" ? (
        <div className="fixed inset-0 -z-10">
          <Image
            src={verseBg}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-background/30" />
          {/* Mascot - centered in right half */}
          <div className="absolute right-0 top-0 bottom-0 left-1/2 flex items-center justify-center">
            <Image
              src={MASCOT_VERSE}
              alt="MOOD MNKY mascot"
              width={360}
              height={400}
              className="h-[80vh] min-h-[420px] w-auto max-w-full object-contain"
              unoptimized
              style={
                isDark
                  ? { filter: "drop-shadow(0 0 56px rgba(0,0,0,0.45))" }
                  : { filter: "drop-shadow(0 0 56px rgba(255,255,255,0.25))" }
              }
              sizes="45vw"
              priority
            />
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 -z-10">
          <Image
            src={VERSE_BG_LIGHT}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-white/20" />
          {/* Dotted Map overlay - subtle light-gray dots, tech-forward aesthetic */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <DottedMap
              className="h-full w-full text-gray-500"
              dotRadius={0.15}
              markers={[]}
            />
          </div>
          {/* Mascot - centered in right half */}
          <div className="absolute right-0 top-0 bottom-0 left-1/2 flex items-center justify-center">
            <Image
              src={MASCOT_LABZ}
              alt="CODE MNKY mascot"
              width={360}
              height={400}
              className="h-[80vh] min-h-[420px] w-auto max-w-full object-contain"
              unoptimized
              style={
                isDark
                  ? { filter: "drop-shadow(0 0 56px rgba(0,0,0,0.45))" }
                  : { filter: "drop-shadow(0 0 56px rgba(255,255,255,0.25))" }
              }
              sizes="45vw"
              priority
            />
          </div>
        </div>
      )}

      {/* Content - center aligned */}
      <BlurFade delay={0.1} inView>
        <div className="flex w-full max-w-lg flex-col items-center gap-8 px-4">
          {activeTab === "verse" ? (
            <AuthVerseLogoBlock />
          ) : (
            <AuthLabzLogoBlock />
          )}
          {showShopifyLinkHint && (
            <p className="w-full max-w-md rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-700 dark:text-amber-300">
              Shopify link failed. If you&apos;re on localhost, use ngrok and add the HTTPS callback URL in Shopify. Check that your app URL and Client ID match Shopify Application setup.
            </p>
          )}
          <DualAuthTabs
            value={activeTab}
            defaultTab="verse"
            onTabChange={setActiveTab}
            appearance={activeTab === "labz" ? "light" : "default"}
            verseRedirectTo={verseRedirectTo}
          />
        </div>
      </BlurFade>
    </div>
  )
}
