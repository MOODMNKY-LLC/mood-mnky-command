"use client"

import React from "react"
import Link from "next/link"
import { SiDiscord, SiGithub } from "react-icons/si"
import { cn } from "@/lib/utils"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { OAuthProviderButton } from "@/components/auth/oauth-provider-button"
export type AuthTab = "verse" | "labz"

export interface DualAuthTabsProps {
  value?: AuthTab
  defaultTab?: AuthTab
  onTabChange?: (tab: AuthTab) => void
  /** Light mode appearance for MNKY LABZ - white card, dark contrast */
  appearance?: "default" | "light"
  /** Redirect path after Verse login (e.g. /verse) */
  verseRedirectTo?: string
}

export function DualAuthTabs({
  value,
  defaultTab = "verse",
  onTabChange,
  appearance = "default",
  verseRedirectTo = "/verse",
}: DualAuthTabsProps) {
  const isLight = appearance === "light"

  return (
    <Tabs
      value={value ?? defaultTab}
      defaultValue={defaultTab}
      className="w-full max-w-md min-h-[340px]"
      onValueChange={(v) => onTabChange?.(v as AuthTab)}
    >
      <TabsList
        className={cn(
          "mb-4 grid w-full grid-cols-2",
          isLight &&
            "border border-gray-200/80 bg-gray-100/80 p-1 backdrop-blur"
        )}
      >
        <TabsTrigger
          value="verse"
          className={
            isLight
              ? "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
              : undefined
          }
        >
          MNKY DOJO
        </TabsTrigger>
        <TabsTrigger
          value="labz"
          className={
            isLight
              ? "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
              : undefined
          }
        >
          MNKY LABZ
        </TabsTrigger>
      </TabsList>

      <TabsContent value="verse">
        <Card className="border border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[var(--verse-text)]">Login to the MNKY DOJO</CardTitle>
            <CardDescription className="text-[var(--verse-text-muted)]">
              Your gateway to the universe of scents
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <OAuthProviderButton
              provider="discord"
              redirectTo={`/verse/auth/callback?next=${encodeURIComponent(verseRedirectTo)}`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--verse-button)] text-[var(--verse-button-text)] text-sm font-medium hover:opacity-90 h-10 px-4 w-full transition-opacity"
            >
              <SiDiscord className="size-5 shrink-0" aria-hidden />
              Login with Discord
            </OAuthProviderButton>
            <LoginForm redirectTo={verseRedirectTo} />
            <div className="text-center">
              <Link
                href="/dojo"
                className="text-xs text-[var(--verse-text-muted)] hover:text-[var(--verse-text)] transition-colors"
              >
                Continue as guest
              </Link>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="labz">
        <Card className="border border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[var(--verse-text)]">
              Login to MNKY LABZ
            </CardTitle>
            <CardDescription className="text-[var(--verse-text-muted)]">
              MNKY VERSE COMMAND CENTER
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <OAuthProviderButton
              provider="github"
              redirectTo="/auth/callback?next=/"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--verse-button)] text-[var(--verse-button-text)] text-sm font-medium hover:opacity-90 h-10 px-4 w-full transition-opacity"
            >
              <SiGithub className="size-5 shrink-0" aria-hidden />
              Login with GitHub
            </OAuthProviderButton>
            <LoginForm variant="default" />
            <div className="text-center">
              <Link
                href="/dojo"
                className="text-xs text-[var(--verse-text-muted)] hover:text-[var(--verse-text)] transition-colors"
              >
                Visit MNKY VERSE
              </Link>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
