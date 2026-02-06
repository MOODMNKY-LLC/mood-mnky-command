import { FlaskConical, Droplets, Package, Palette } from "lucide-react"
import { DASHBOARD_STATS } from "@/lib/data"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ShopifyStatus } from "@/components/dashboard/shopify-status"
import { NotionStatus } from "@/components/dashboard/notion-status"

export default function DashboardPage() {
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
        <StatCard
          title="Formulas"
          value={DASHBOARD_STATS.totalFormulas}
          description="Active formulations"
          icon={FlaskConical}
        />
        <StatCard
          title="Fragrance Oils"
          value={DASHBOARD_STATS.totalFragrances}
          description="In your catalog"
          icon={Droplets}
        />
        <StatCard
          title="Products"
          value={DASHBOARD_STATS.totalProducts}
          description="Listed on Shopify"
          icon={Package}
        />
        <StatCard
          title="Blends"
          value={8}
          description="Custom blends saved"
          icon={Palette}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <ActivityFeed activities={DASHBOARD_STATS.recentActivity} />
        <QuickActions />
        <ShopifyStatus />
        <NotionStatus />
      </div>
    </div>
  )
}
