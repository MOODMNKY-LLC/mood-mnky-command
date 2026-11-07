"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { AuthVerseLogoBlock } from "@/components/auth/auth-verse-logo-block"
import { ConsumerLoginCard } from "@/components/auth/consumer-login-card"
import { safeReturnPath } from "@/lib/auth/safe-return-path"

const MASCOT = "/verse/mood-mnky-3d.png"

/**
 * Consumer account entry — no Dojo/LABZ tab chooser.
 * Staff LABZ login lives at /auth/staff (not offered as a consumer path).
 */
export default function LoginPage() {
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  const next = safeReturnPath(searchParams.get("next"), "/dojo/me")

  useEffect(() => setMounted(true), [])

  const isDark = !mounted ? true : (resolvedTheme ?? "dark") === "dark"

  const mascot = (
    <Image
      src={MASCOT}
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
  )

  return (
    <AuthPageLayout mascot={mascot}>
      <div className="flex w-full max-w-lg flex-col items-center px-4">
        <div className="flex h-[200px] w-full flex-col items-center justify-start md:h-[220px]">
          <AuthVerseLogoBlock />
        </div>
        <div className="w-full max-w-md pt-2">
          <ConsumerLoginCard redirectTo={next} />
        </div>
        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          Staff?{" "}
          <Link href="/auth/staff" className="underline-offset-2 hover:underline">
            LABZ operator sign-in
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  )
}
