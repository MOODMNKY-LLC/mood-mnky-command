"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { DualAuthTabs, type AuthTab } from "@/components/auth/dual-auth-tabs"
import { AuthVerseLogoBlock } from "@/components/auth/auth-verse-logo-block"
import { AuthLabzLogoBlock } from "@/components/auth/auth-labz-logo-block"

const MASCOT_VERSE = "/verse/mood-mnky-3d.png"
const MASCOT_LABZ = "/verse/code-mnky-3d.png"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<AuthTab>("verse")
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  const next = searchParams.get("next")
  const verseRedirectTo = next?.startsWith("/") ? next : "/verse"

  useEffect(() => setMounted(true), [])

  const isDark = !mounted ? true : (resolvedTheme ?? "dark") === "dark"
  const mascotSrc = activeTab === "verse" ? MASCOT_VERSE : MASCOT_LABZ
  const mascotAlt = activeTab === "verse" ? "MOOD MNKY mascot" : "CODE MNKY mascot"

  const mascot = (
    <Image
      src={mascotSrc}
      alt={mascotAlt}
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
  )

  return (
    <AuthPageLayout mascot={mascot}>
      <div className="flex w-full max-w-lg flex-col items-center px-4">
        {/* Fixed-height header slot: logos/headings align so nothing moves when switching tabs */}
        <div className="flex h-[220px] w-full flex-col items-center justify-start md:h-[240px]">
          {activeTab === "verse" ? (
            <AuthVerseLogoBlock />
          ) : (
            <AuthLabzLogoBlock />
          )}
        </div>
        {/* Fixed gap then auth components in same position */}
        <div className="w-full pt-4">
          <DualAuthTabs
            value={activeTab}
            defaultTab="verse"
            onTabChange={setActiveTab}
            appearance="default"
            verseRedirectTo={verseRedirectTo}
          />
        </div>
      </div>
    </AuthPageLayout>
  )
}
