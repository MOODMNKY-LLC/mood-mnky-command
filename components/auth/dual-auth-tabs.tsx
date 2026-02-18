"use client"

import React from "react"
import Link from "next/link"
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
import { LoginWithShopifyButton } from "@/components/auth/login-with-shopify-button"
export type AuthTab = "verse" | "labz"

export interface DualAuthTabsProps {
  value?: AuthTab
  defaultTab?: AuthTab
  onTabChange?: (tab: AuthTab) => void
  /** Light mode appearance for MNKY LABZ - white card, dark contrast */
  appearance?: "default" | "light"
}

export function DualAuthTabs({
  value,
  defaultTab = "verse",
  onTabChange,
  appearance = "default",
}: DualAuthTabsProps) {
  const isLight = appearance === "light"

  return (
    <Tabs
      value={value ?? defaultTab}
      defaultValue={defaultTab}
      className="w-full max-w-md"
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
          MNKY VERSE
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
        <Card className="border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Login to the MNKY VERSE</CardTitle>
            <CardDescription>
              Your gateway to the universe of scents
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <LoginWithShopifyButton />
            <Link
              href="/verse/auth/discord"
              className="inline-flex items-center justify-center rounded-md bg-[#5865F2] text-white text-sm font-medium hover:bg-[#4752C4] h-10 px-4 w-full transition-colors"
            >
              Login with Discord
            </Link>
            <div className="text-center">
              <Link
                href="/verse"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Continue as guest
              </Link>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="labz">
        <Card
          className={cn(
            isLight
              ? "border-gray-200/80 bg-white/95 text-gray-900 shadow-lg backdrop-blur"
              : "border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
          )}
        >
          <CardHeader className="pb-4">
            <CardTitle
              className={cn(
                "text-lg",
                isLight && "text-gray-900"
              )}
            >
              Login to MNKY LABZ
            </CardTitle>
            <CardDescription
              className={isLight ? "text-gray-600" : undefined}
            >
              Admin access to manage your product lab
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm variant={isLight ? "light" : "default"} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
