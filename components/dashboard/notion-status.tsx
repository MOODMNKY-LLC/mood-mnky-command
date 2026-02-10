"use client"

import { useState, useCallback } from "react"
import useSWR, { useSWRConfig } from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Database, Loader2, AlertCircle, RefreshCw } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const FRAGRANCE_OILS_SYNC_ENDPOINT = "/api/notion/sync/fragrance-oils"
const DASHBOARD_STATS_KEY = "/api/dashboard/stats"

export function NotionStatus() {
  const { mutate } = useSWRConfig()
  const [isSyncingOils, setIsSyncingOils] = useState(false)
  const [syncOilsError, setSyncOilsError] = useState<string | null>(null)

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

  const syncFragranceOils = useCallback(async () => {
    setIsSyncingOils(true)
    setSyncOilsError(null)
    try {
      const res = await fetch(FRAGRANCE_OILS_SYNC_ENDPOINT, { method: "POST" })
      const json = await res.json()
      if (json.error) {
        setSyncOilsError(json.error)
        return
      }
      await mutate(DASHBOARD_STATS_KEY)
      await mutateDatabases()
    } catch (e) {
      setSyncOilsError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setIsSyncingOils(false)
    }
  }, [mutate, mutateDatabases])

  return (
    <Card className="bg-card border-border">
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
            {syncOilsError && (
              <p className="text-xs text-destructive">{syncOilsError}</p>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={syncFragranceOils}
                disabled={isSyncingOils}
                className="w-full text-xs"
              >
                {isSyncingOils ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                {isSyncingOils ? "Syncing..." : "Sync fragrance oils to Supabase"}
              </Button>
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
