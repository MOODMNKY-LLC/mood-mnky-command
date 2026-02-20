"use client"

import { useState, useCallback } from "react"
import useSWR, { useSWRConfig } from "swr"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ExternalLink, Database, Loader2, AlertCircle, RefreshCw } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const DASHBOARD_STATS_KEY = "/api/dashboard/stats"

type SyncStep = { path: string; method: "GET" | "POST"; body?: Record<string, string>; label: string }

const NOTION_SYNC_STEPS: SyncStep[] = [
  { path: "/api/notion/sync/fragrance-oils", method: "POST", label: "Fragrance oils" },
  { path: "/api/notion/sync/collections", method: "GET", label: "Collections" },
  {
    path: "/api/notion/sync/fragrance-notes",
    method: "POST",
    body: { direction: "to-supabase" },
    label: "Fragrance notes",
  },
  { path: "/api/notion/sync/blog", method: "POST", label: "Blog" },
  { path: "/api/notion/sync/assistant-knowledge", method: "POST", label: "Assistant knowledge" },
]

type SyncProgress = { current: number; total: number; label: string }

export function NotionStatus() {
  const { mutate } = useSWRConfig()
  const [isSyncingAllNotion, setIsSyncingAllNotion] = useState(false)
  const [isSyncingAppWide, setIsSyncingAppWide] = useState(false)
  const [notionProgress, setNotionProgress] = useState<SyncProgress | null>(null)
  const [appWideProgress, setAppWideProgress] = useState<SyncProgress | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<{ count: number; total: number; at: string } | null>(null)

  const {
    data,
    error,
    isLoading,
    mutate: mutateDatabases,
  } = useSWR("/api/notion/databases", fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 1,
    dedupingInterval: 30000,
  })

  const isConnected = data?.databases && !error
  const databases: Array<{
    key: string
    title: string
    recordCount: number
    error?: string
  }> = data?.databases || []
  const totalRecords = data?.totalRecords ?? 0

  const runSyncSteps = useCallback(
    async (
      steps: SyncStep[],
      setProgress: (p: SyncProgress | null) => void,
    ): Promise<{ success: boolean; error?: string }[]> => {
      const results: { success: boolean; error?: string }[] = []
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        setProgress({ current: i + 1, total: steps.length, label: step.label })
        try {
          const res = await fetch(step.path, {
            method: step.method,
            headers: step.body ? { "Content-Type": "application/json" } : undefined,
            body: step.body ? JSON.stringify(step.body) : undefined,
          })
          const data = await res.json().catch(() => ({}))
          results.push({ success: res.ok && !data.error, error: data.error })
        } catch (err) {
          results.push({ success: false, error: err instanceof Error ? err.message : "Request failed" })
        }
      }
      setProgress(null)
      return results
    },
    [],
  )

  const syncAllNotion = useCallback(async () => {
    setIsSyncingAllNotion(true)
    try {
      const results = await runSyncSteps(NOTION_SYNC_STEPS, setNotionProgress)
      const ok = results.filter((r) => r.success).length
      const total = results.length
      if (total > 0) {
        setLastSyncAt({
          count: ok,
          total,
          at: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        })
      }
      await mutate(DASHBOARD_STATS_KEY)
      await mutateDatabases()
      if (ok === total) {
        toast.success("Synced all Notion databases", { description: `${ok} of ${total} synced.` })
      } else if (ok > 0) {
        const failed = NOTION_SYNC_STEPS.filter((_, i) => !results[i].success).map((s) => s.label)
        toast.warning("Notion sync partial", {
          description: `${ok}/${total} synced. ${failed.join(", ")} failed.`,
        })
      } else {
        const first = results.find((r) => r.error)
        toast.error("Notion sync failed", { description: first?.error ?? "All syncs failed." })
      }
    } catch (e) {
      setNotionProgress(null)
      toast.error("Notion sync failed", { description: e instanceof Error ? e.message : "Request failed" })
    } finally {
      setIsSyncingAllNotion(false)
    }
  }, [mutate, mutateDatabases, runSyncSteps])

  const syncAllAppWide = useCallback(async () => {
    setIsSyncingAppWide(true)
    const totalSteps = NOTION_SYNC_STEPS.length + 1
    try {
      const notionResults = await runSyncSteps(NOTION_SYNC_STEPS, setAppWideProgress)
      setAppWideProgress({ current: totalSteps, total: totalSteps, label: "Shopify metaobjects" })
      let shopifyOk = false
      let shopifyData: { created?: number; updated?: number; error?: string } = {}
      try {
        const res = await fetch("/api/shopify/sync/metaobject-fragrance-notes", { method: "POST" })
        shopifyData = await res.json().catch(() => ({}))
        shopifyOk = res.ok && !shopifyData.error
      } finally {
        setAppWideProgress(null)
      }
      const notionOk = notionResults.filter((r) => r.success).length
      const notionTotal = notionResults.length
      if (notionOk === notionTotal && shopifyOk) {
        toast.success("App-wide sync complete", {
          description: `Notion: ${notionOk} DBs. Shopify: ${shopifyData.created ?? 0} created, ${shopifyData.updated ?? 0} updated.`,
        })
      } else if (notionOk > 0 || shopifyOk) {
        const parts = []
        if (notionOk < notionTotal) parts.push(`Notion: ${notionOk}/${notionTotal}`)
        if (!shopifyOk) parts.push(`Shopify: ${shopifyData.error ?? "failed"}`)
        toast.warning("App-wide sync partial", { description: parts.join(". ") })
      } else {
        toast.error("App-wide sync failed", {
          description: shopifyData.error ?? notionResults.find((r) => r.error)?.error ?? "Sync failed.",
        })
      }
    } catch (e) {
      setAppWideProgress(null)
      toast.error("App-wide sync failed", { description: e instanceof Error ? e.message : "Request failed" })
    } finally {
      setIsSyncingAppWide(false)
    }
  }, [runSyncSteps])

  return (
    <Card className={`bg-card border-border ${isConnected ? "border-l-4 border-l-primary/50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Notion Sync
          </CardTitle>
          <Badge
            className={`text-[10px] border-0 ${
              isLoading
                ? "bg-muted text-muted-foreground"
                : isConnected
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
            }`}
          >
            {isLoading
              ? "Connecting..."
              : isConnected
                ? "Connected"
                : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting to Notion...
          </div>
        ) : isConnected ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                MNKY_MIND Workspace
              </span>
              <a
                href="https://www.notion.so"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex flex-col gap-1.5">
              {databases.map((db) => (
                <div
                  key={db.key}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground truncate">
                    {db.title}
                  </span>
                  {db.error ? (
                    <span className="text-xs text-destructive">Error</span>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {db.recordCount} records
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Total Records
              </span>
              <span className="text-sm font-mono font-semibold text-foreground">
                {totalRecords}
              </span>
            </div>
            {(notionProgress || appWideProgress) && (
              <div className="flex flex-col gap-1.5">
                <Progress
                  value={
                    ((notionProgress ?? appWideProgress)!.current /
                      (notionProgress ?? appWideProgress)!.total) *
                    100
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Step {(notionProgress ?? appWideProgress)!.current} of{" "}
                  {(notionProgress ?? appWideProgress)!.total}:{" "}
                  {(notionProgress ?? appWideProgress)!.label}
                </p>
              </div>
            )}
            {lastSyncAt && !notionProgress && !appWideProgress && (
              <>
                <p className="text-xs text-muted-foreground">
                  Last synced: {lastSyncAt.count}/{lastSyncAt.total} at {lastSyncAt.at}
                </p>
                {lastSyncAt.count < lastSyncAt.total && (
                  <p className="text-xs text-muted-foreground">
                    Next step: Retry sync or check Full sync &amp; options.
                  </p>
                )}
              </>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="default"
                size="sm"
                onClick={syncAllNotion}
                disabled={isSyncingAllNotion || isSyncingAppWide}
                className="w-full text-xs"
              >
                {isSyncingAllNotion ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                {isSyncingAllNotion ? "Syncing..." : "Sync all Notion databases"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={syncAllAppWide}
                disabled={isSyncingAllNotion || isSyncingAppWide}
                className="w-full text-xs"
              >
                {isSyncingAppWide ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                {isSyncingAppWide ? "Syncing..." : "Sync all app-wide"}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                For per-database or directional sync, use Full sync &amp; options.
              </p>
              <Link
                href="/notion"
                className="text-center text-xs text-primary hover:underline"
              >
                Full sync &amp; options →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span>Add NOTION_API_KEY in the Vars sidebar.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
