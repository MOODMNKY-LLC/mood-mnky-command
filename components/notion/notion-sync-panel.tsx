"use client"

import React from "react"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Droplets,
  FlaskConical,
  FolderOpen,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SyncResult {
  database: string
  total: number
  syncedAt: string
  items: Array<Record<string, unknown>>
}

function formatDate(iso: string) {
  if (!iso) return "N/A"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function DatabaseCard({
  title,
  icon: Icon,
  endpoint,
  itemKey,
  columns,
}: {
  title: string
  icon: React.ElementType
  endpoint: string
  itemKey: string
  columns: Array<{ key: string; label: string }>
}) {
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const handleSync = useCallback(async () => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch(endpoint)
      const data = await res.json()
      if (data.error) {
        setSyncError(data.error)
      } else {
        setSyncResult({
          database: data.database,
          total: data.total,
          syncedAt: data.syncedAt,
          items: data[itemKey] || [],
        })
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setIsSyncing(false)
    }
  }, [endpoint, itemKey])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {syncResult && (
              <Badge className="text-[10px] border-0 bg-success/10 text-success">
                {syncResult.total} records
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="h-7 text-xs bg-transparent"
            >
              {isSyncing ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              {isSyncing ? "Syncing..." : "Sync"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {syncError && (
          <div className="flex items-center gap-2 text-sm text-destructive mb-3">
            <AlertCircle className="h-4 w-4" />
            {syncError}
          </div>
        )}
        {syncResult ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Last synced: {formatDate(syncResult.syncedAt)}
              </span>
              <span className="font-mono">{syncResult.total} total</span>
            </div>
            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.key} className="text-xs">
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="text-xs w-10">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncResult.items.slice(0, 50).map((item, idx) => (
                    <TableRow key={`${String(item.notionId || idx)}`}>
                      {columns.map((col) => (
                        <TableCell key={col.key} className="text-xs">
                          {Array.isArray(item[col.key])
                            ? (item[col.key] as string[]).join(", ")
                            : String(item[col.key] ?? "")}
                        </TableCell>
                      ))}
                      <TableCell>
                        {item.notionUrl ? (
                          <a
                            href={String(item.notionUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : !isSyncing ? (
          <p className="text-sm text-muted-foreground">
            Click Sync to pull the latest data from Notion.
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching from Notion...
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NotionSyncPanel() {
  const {
    data: dbData,
    error: dbError,
    isLoading: dbLoading,
  } = useSWR("/api/notion/databases", fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 1,
  })

  const isConnected = dbData?.databases && !dbError

  if (dbLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Connecting to Notion...
      </div>
    )
  }

  if (!isConnected) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground text-center">
            Notion is not connected. Add your{" "}
            <code className="font-mono text-xs bg-secondary px-1 py-0.5 rounded">
              NOTION_API_KEY
            </code>{" "}
            in the Vars sidebar to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Connection Status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              MNKY_MIND Workspace
            </CardTitle>
            <Badge className="text-[10px] border-0 bg-success/10 text-success">
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {dbData.databases.map(
              (db: {
                key: string
                title: string
                propertyCount: number
                lastEditedTime: string
                error?: string
              }) => (
                <div
                  key={db.key}
                  className="flex flex-col gap-1 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <span className="text-xs font-medium text-foreground">
                    {db.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {db.error
                      ? "Error connecting"
                      : `${db.propertyCount} properties`}
                  </span>
                  {db.lastEditedTime && (
                    <span className="text-[10px] text-muted-foreground">
                      Updated: {formatDate(db.lastEditedTime)}
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Tabs */}
      <Tabs defaultValue="fragrance-oils" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fragrance-oils" className="text-xs">
            <Droplets className="mr-1 h-3 w-3" />
            Fragrance Oils
          </TabsTrigger>
          <TabsTrigger value="formulas" className="text-xs">
            <FlaskConical className="mr-1 h-3 w-3" />
            Formulas
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-xs">
            <FolderOpen className="mr-1 h-3 w-3" />
            Collections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fragrance-oils" className="mt-4">
          <DatabaseCard
            title="MNKY Science Fragrance Oils"
            icon={Droplets}
            endpoint="/api/notion/sync/fragrance-oils"
            itemKey="fragranceOils"
            columns={[
              { key: "name", label: "Name" },
              { key: "family", label: "Family" },
              { key: "type", label: "Type" },
              { key: "maxUsageCandle", label: "Max Candle %" },
              { key: "rating", label: "Rating" },
            ]}
          />
        </TabsContent>

        <TabsContent value="formulas" className="mt-4">
          <DatabaseCard
            title="MNKY Formulas"
            icon={FlaskConical}
            endpoint="/api/notion/sync/formulas"
            itemKey="formulas"
            columns={[
              { key: "name", label: "Name" },
              { key: "productType", label: "Type" },
              { key: "baseType", label: "Base" },
              { key: "status", label: "Status" },
              { key: "fragranceLoad", label: "Frag Load %" },
            ]}
          />
        </TabsContent>

        <TabsContent value="collections" className="mt-4">
          <DatabaseCard
            title="MNKY Collections"
            icon={FolderOpen}
            endpoint="/api/notion/sync/collections"
            itemKey="collections"
            columns={[
              { key: "name", label: "Name" },
              { key: "collectionType", label: "Type" },
              { key: "season", label: "Season" },
              { key: "activePromotion", label: "Promo" },
              { key: "status", label: "Status" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
