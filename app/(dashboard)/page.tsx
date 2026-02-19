"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { FlaskConical, Droplets, Package, Palette, Loader2 } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ShopifyStatus } from "@/components/dashboard/shopify-status"
import { NotionStatus } from "@/components/dashboard/notion-status"
import { LabzHubCard } from "@/components/dashboard/labz-hub-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { dashboardConfig } from "@/lib/dashboard-config"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export default function DashboardPage() {
  const [connectAlertDismissed, setConnectAlertDismissed] = useState(false)
  const { data: stats, isLoading } = useSWR("/api/dashboard/stats", fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    dedupingInterval: dashboardConfig.defaultStatsRefreshInterval,
  })

  const bothDisconnected =
    !isLoading &&
    stats &&
    !stats.notionConnected &&
    !stats.shopifyConnected
  const showConnectAlert =
    dashboardConfig.showConnectAlert && bothDisconnected && !connectAlertDismissed

  const secondRowSections = dashboardConfig.sectionOrder.filter(
    (id) => id !== "stats"
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your MOOD MNKY product lab
        </p>
      </div>

      {showConnectAlert && (
        <Alert className="border-muted-foreground/30 bg-muted/30">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Connect Notion and Shopify to unlock full LABZ sync and store stats.
            </span>
            <span className="flex items-center gap-2">
              <Link href="/docs" className="text-primary text-sm font-medium hover:underline">
                Docs
              </Link>
              <button
                type="button"
                onClick={() => setConnectAlertDismissed(true)}
                className="text-muted-foreground text-sm hover:text-foreground"
              >
                Dismiss
              </button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Formulas"
              value={stats?.totalFormulas ?? 0}
              description="Bath & body from Whole Elise"
              icon={FlaskConical}
              tooltip="From Supabase"
              animateValue
            />
            <StatCard
              title="Fragrance Oils"
              value={stats?.totalFragrances ?? 0}
              description={stats?.notionConnected ? "Synced from Notion" : "Connect Notion to sync"}
              icon={Droplets}
              status={stats?.notionConnected ? "success" : "default"}
              tooltip={stats?.notionConnected ? "Synced from Notion" : "Connect Notion to sync"}
              animateValue
            />
            <StatCard
              title="Products"
              value={stats?.totalProducts ?? 0}
              description={stats?.shopifyConnected ? "Active on Shopify" : "Connect Shopify to sync"}
              icon={Package}
              tooltip={stats?.shopifyConnected ? "From Shopify" : "Connect Shopify to sync"}
            />
            <StatCard
              title="Collections"
              value={stats?.totalCollections ?? 0}
              description={stats?.shopifyConnected ? "Active on Shopify" : "Connect Shopify to sync"}
              icon={Palette}
              tooltip={stats?.shopifyConnected ? "From Shopify" : "Connect Shopify to sync"}
            />
          </>
        )}
      </div>

      <Separator className="my-1" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {secondRowSections.map((id) => {
          if (id === "labzHub" && !dashboardConfig.showLabzHubCard) return null
          if (id === "labzHub")
            return (
              <LabzHubCard
                key="labzHub"
                labzPagesCount={stats?.labzPagesCount}
                glossaryCount={stats?.glossaryCount}
              />
            )
          if (id === "activityFeed")
            return (
              <ActivityFeed
                key="activityFeed"
                activities={stats?.recentActivity ?? []}
                isLoading={isLoading}
              />
            )
          if (id === "quickActions") return <QuickActions key="quickActions" />
          if (id === "shopifyStatus") return <ShopifyStatus key="shopifyStatus" />
          if (id === "notionStatus") return <NotionStatus key="notionStatus" />
          return null
        })}
      </div>
    </div>
  )
}
