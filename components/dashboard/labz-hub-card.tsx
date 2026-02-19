"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layout, ExternalLink, Database, Loader2, RefreshCw } from "lucide-react"
import { dashboardConfig } from "@/lib/dashboard-config"

interface LabzHubCardProps {
  /** Optional LABZ pages count from dashboard stats (shown when showLabzPagesCountInStats is true). */
  labzPagesCount?: number
  /** Optional glossary (fragrance_notes) count for display in hub. */
  glossaryCount?: number
}

export function LabzHubCard({ labzPagesCount, glossaryCount }: LabzHubCardProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncAllAppWide = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch("/api/sync/all", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      const notionOk = data.notion?.ok ?? false
      const notionCount = Array.isArray(data.notion?.results)
        ? data.notion.results.filter((r: { success?: boolean }) => r.success).length
        : 0
      const shopifyOk = data.shopify?.created !== undefined || data.shopify?.updated !== undefined || (data.shopify && !data.shopify.error)
      const shopifyMsg =
        typeof data.shopify?.created === "number"
          ? `Shopify: ${data.shopify.created} created, ${data.shopify.updated ?? 0} updated`
          : data.shopify?.error
            ? `Shopify: ${data.shopify.error}`
            : ""

      if (notionOk && shopifyOk) {
        toast.success("App-wide sync complete", {
          description: `Notion: ${notionCount} DBs. ${shopifyMsg}`.trim(),
        })
      } else if (notionOk || shopifyOk) {
        toast.warning("App-wide sync partial", {
          description: [notionOk ? `Notion: ${notionCount} synced` : "Notion failed", shopifyMsg].filter(Boolean).join(". "),
        })
      } else {
        toast.error("App-wide sync failed", {
          description: data.shopify?.error ?? data.notion?.results?.[0]?.error ?? "Request failed",
        })
      }
    } catch (e) {
      toast.error("App-wide sync failed", {
        description: e instanceof Error ? e.message : "Request failed",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          LABZ command center
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Sync Notion and Shopify, then manage store LABZ pages.
        </p>
        {dashboardConfig.showLabzPagesCountInStats && (typeof labzPagesCount === "number" || typeof glossaryCount === "number") && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {typeof labzPagesCount === "number" && (
              <span>LABZ pages on store: <span className="font-medium text-foreground">{labzPagesCount}</span></span>
            )}
            {typeof glossaryCount === "number" && (
              <span>Glossary terms: <span className="font-medium text-foreground">{glossaryCount}</span></span>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSyncAllAppWide}
            disabled={isSyncing}
            aria-label="Sync all app-wide"
          >
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3" />
            )}
            Sync all app-wide
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/notion" className="inline-flex items-center gap-2">
              <Database className="h-3.5 w-3" />
              Full sync & options
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/store/labz-pages" className="inline-flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3" />
              Open LABZ Pages
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
