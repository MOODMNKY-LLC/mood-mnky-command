"use client"

import useSWR from "swr"
import { FlaskConical, Droplets, Package, Palette, Loader2 } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ShopifyStatus } from "@/components/dashboard/shopify-status"
import { NotionStatus } from "@/components/dashboard/notion-status"
import { Skeleton } from "@/components/ui/skeleton"

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
  const { data: stats, isLoading } = useSWR("/api/dashboard/stats", fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    dedupingInterval: 30000,
  })

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
            />
            <StatCard
              title="Fragrance Oils"
              value={stats?.totalFragrances ?? 0}
              description={stats?.notionConnected ? "In MNKY Science catalog" : "Connect Notion to sync"}
              icon={Droplets}
            />
            <StatCard
              title="Products"
              value={stats?.totalProducts ?? 0}
              description={stats?.shopifyConnected ? "Active on Shopify" : "Connect Shopify to sync"}
              icon={Package}
            />
            <StatCard
              title="Collections"
              value={stats?.totalCollections ?? 0}
              description={stats?.shopifyConnected ? "Active on Shopify" : "Connect Shopify to sync"}
              icon={Palette}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <ActivityFeed
          activities={stats?.recentActivity ?? []}
          isLoading={isLoading}
        />
        <QuickActions />
        <ShopifyStatus />
        <NotionStatus />
      </div>
    </div>
  )
}
