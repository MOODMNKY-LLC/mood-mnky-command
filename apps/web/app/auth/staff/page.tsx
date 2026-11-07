"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { SiGithub } from "react-icons/si"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { AuthLabzLogoBlock } from "@/components/auth/auth-labz-logo-block"
import { LoginForm } from "@/components/auth/login-form"
import { OAuthProviderButton } from "@/components/auth/oauth-provider-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const MASCOT = "/verse/code-mnky-3d.png"

/** Staff-only LABZ entry — not shown as a consumer tab. */
export default function StaffLoginPage() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  useEffect(() => setMounted(true), [])
  const isDark = !mounted ? true : (resolvedTheme ?? "dark") === "dark"

  const mascot = (
    <Image
      src={MASCOT}
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
  )

  return (
    <AuthPageLayout mascot={mascot}>
      <div className="flex w-full max-w-lg flex-col items-center px-4">
        <div className="flex h-[200px] w-full flex-col items-center justify-start md:h-[220px]">
          <AuthLabzLogoBlock />
        </div>
        <Card className="mt-2 w-full max-w-md border border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[var(--verse-text)]">
              MNKY LABZ
            </CardTitle>
            <CardDescription className="text-[var(--verse-text-muted)]">
              Operator command center. Not a consumer signup path.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <OAuthProviderButton
              provider="github"
              redirectTo="/auth/callback?next=/platform"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--verse-button)] px-4 text-sm font-medium text-[var(--verse-button-text)] transition-opacity hover:opacity-90"
            >
              <SiGithub className="size-5 shrink-0" aria-hidden />
              Sign in with GitHub
            </OAuthProviderButton>
            <LoginForm redirectTo="/platform" />
            <Link
              href="/auth/login"
              className="text-center text-xs text-[var(--verse-text-muted)] transition-colors hover:text-[var(--verse-text)]"
            >
              Consumer account sign-in
            </Link>
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  )
}
