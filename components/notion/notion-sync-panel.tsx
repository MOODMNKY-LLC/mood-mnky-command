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
  FolderOpen,
  BookOpen,
  FileText,
  ArrowDownToLine,
  ArrowUpToLine,
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
  syncMethod = "GET",
  postSyncItemsEndpoint,
  rowKeyProp = "notionId",
}: {
  title: string
  icon: React.ElementType
  endpoint: string
  itemKey: string
  columns: Array<{ key: string; label: string }>
  syncMethod?: "GET" | "POST"
  postSyncItemsEndpoint?: string
  rowKeyProp?: string
}) {
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const handleSync = useCallback(async () => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch(endpoint, {
        method: syncMethod,
      })
      const data = await res.json()
      if (data.error) {
        setSyncError(data.error)
      } else {
        let items = data[itemKey] || []
        if (syncMethod === "POST" && postSyncItemsEndpoint && data.recordsSynced != null) {
          const itemsRes = await fetch(postSyncItemsEndpoint)
          const itemsData = await itemsRes.json()
          items = itemsData[itemKey] || itemsData.fragranceOils || []
        }
        setSyncResult({
          database: data.database || title,
          total: data.recordsSynced ?? data.total ?? items.length,
          syncedAt: data.syncedAt ?? new Date().toISOString(),
          items,
        })
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setIsSyncing(false)
    }
  }, [endpoint, itemKey, syncMethod, postSyncItemsEndpoint, title])

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
                {syncMethod === "POST"
                  ? `${syncResult.total} synced to Supabase`
                  : `${syncResult.total} records`}
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
                    <TableRow key={`${String((item as Record<string, unknown>)[rowKeyProp] ?? item.id ?? idx)}`}>
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

const FRAGRANCE_NOTES_ENDPOINT = "/api/notion/sync/fragrance-notes"

function NoteGlossaryCard({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  const [notes, setNotes] = useState<Array<{ name: string; slug: string; descriptionShort: string }>>([])
  const [total, setTotal] = useState(0)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [syncDirection, setSyncDirection] = useState<"to-supabase" | "to-notion" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(FRAGRANCE_NOTES_ENDPOINT)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setNotes(data.notes ?? [])
        setTotal(data.total ?? 0)
        setLastSyncedAt(data.syncedAt ?? null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSync = useCallback(async (direction: "to-supabase" | "to-notion") => {
    setSyncDirection(direction)
    setError(null)
    try {
      const res = await fetch(FRAGRANCE_NOTES_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setLastSyncedAt(data.syncedAt ?? new Date().toISOString())
        if (direction === "to-supabase") {
          setTotal(data.recordsSynced ?? data.total ?? total)
        }
        await handleFetch()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setSyncDirection(null)
    }
  }, [total, handleFetch])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastSyncedAt && total > 0 && (
              <Badge className="text-[10px] border-0 bg-success/10 text-success">
                {total} records
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetch}
              disabled={isLoading}
              className="h-7 text-xs bg-transparent"
            >
              {isLoading && !syncDirection ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              Fetch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("to-supabase")}
              disabled={isLoading}
              className="h-7 text-xs bg-transparent"
              title="Notion → Supabase"
            >
              {syncDirection === "to-supabase" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ArrowDownToLine className="mr-1 h-3 w-3" />
              )}
              To Supabase
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("to-notion")}
              disabled={isLoading}
              className="h-7 text-xs bg-transparent"
              title="Supabase → Notion"
            >
              {syncDirection === "to-notion" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ArrowUpToLine className="mr-1 h-3 w-3" />
              )}
              To Notion
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive mb-3">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {notes.length > 0 ? (
          <div className="flex flex-col gap-3">
            {lastSyncedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Last fetched: {formatDate(lastSyncedAt)}
              </div>
            )}
            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Slug</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs w-10">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.slice(0, 50).map((note, idx) => (
                    <TableRow key={note.slug || idx}>
                      <TableCell className="text-xs">{note.name}</TableCell>
                      <TableCell className="text-xs font-mono">{note.slug}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {note.descriptionShort || "—"}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : !isLoading ? (
          <p className="text-sm text-muted-foreground">
            Click Fetch to load from Notion, or use To Supabase / To Notion to sync.
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {syncDirection ? "Syncing..." : "Fetching from Notion..."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const DOCS_SYNC_ENDPOINT = "/api/notion/sync/docs"

function DocsCommandCard({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  const [docs, setDocs] = useState<Array<{ title: string; slug: string; category: string; description: string }>>([])
  const [total, setTotal] = useState(0)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [syncDirection, setSyncDirection] = useState<"to-files" | "to-notion" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(DOCS_SYNC_ENDPOINT)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setDocs(data.docs ?? [])
        setTotal(data.total ?? 0)
        setLastSyncedAt(data.syncedAt ?? null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSync = useCallback(async (direction: "to-files" | "to-notion") => {
    setSyncDirection(direction)
    setError(null)
    try {
      const res = await fetch(DOCS_SYNC_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setLastSyncedAt(data.syncedAt ?? new Date().toISOString())
        setTotal(data.total ?? data.written ?? (data.created ?? 0) + (data.updated ?? 0) ?? total)
        await handleFetch()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setSyncDirection(null)
    }
  }, [total, handleFetch])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastSyncedAt && total > 0 && (
              <Badge className="text-[10px] border-0 bg-success/10 text-success">
                {total} docs
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetch}
              disabled={isLoading}
              className="h-7 text-xs bg-transparent"
            >
              {isLoading && !syncDirection ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              Fetch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("to-files")}
              disabled={isLoading}
              className="h-7 text-xs bg-transparent"
              title="Notion → Files"
            >
              {syncDirection === "to-files" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ArrowDownToLine className="mr-1 h-3 w-3" />
              )}
              To Files
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("to-notion")}
              disabled={isLoading}
              className="h-7 text-xs bg-transparent"
              title="Files → Notion"
            >
              {syncDirection === "to-notion" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ArrowUpToLine className="mr-1 h-3 w-3" />
              )}
              To Notion
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive mb-3">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {docs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {lastSyncedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Last fetched: {formatDate(lastSyncedAt)}
              </div>
            )}
            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Slug</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs max-w-[200px]">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.slice(0, 50).map((doc, idx) => (
                    <TableRow key={`${doc.category}-${doc.slug}-${idx}`}>
                      <TableCell className="text-xs">{doc.title}</TableCell>
                      <TableCell className="text-xs font-mono">{doc.slug}</TableCell>
                      <TableCell className="text-xs">{doc.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {doc.description || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : !isLoading ? (
          <p className="text-sm text-muted-foreground">
            Click Fetch to load from Notion, or use To Files / To Notion to sync.
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {syncDirection ? "Syncing..." : "Fetching from Notion..."}
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
                recordCount?: number
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
                      : `${db.recordCount ?? 0} records`}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fragrance-oils" className="text-xs">
            <Droplets className="mr-1 h-3 w-3" />
            Fragrance Oils
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-xs">
            <FolderOpen className="mr-1 h-3 w-3" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="note-glossary" className="text-xs">
            <BookOpen className="mr-1 h-3 w-3" />
            Note Glossary
          </TabsTrigger>
          <TabsTrigger value="docs" className="text-xs">
            <FileText className="mr-1 h-3 w-3" />
            Command Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fragrance-oils" className="mt-4">
          <DatabaseCard
            title="MNKY Science Fragrance Oils"
            icon={Droplets}
            endpoint="/api/notion/sync/fragrance-oils"
            itemKey="fragranceOils"
            syncMethod="POST"
            postSyncItemsEndpoint="/api/fragrance-oils"
            rowKeyProp="id"
            columns={[
              { key: "name", label: "Name" },
              { key: "family", label: "Family" },
              { key: "type", label: "Type" },
              { key: "maxUsageCandle", label: "Max Candle %" },
              { key: "rating", label: "Rating" },
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

        <TabsContent value="note-glossary" className="mt-4">
          <NoteGlossaryCard title="MNKY Note Glossary" icon={BookOpen} />
        </TabsContent>
        <TabsContent value="docs" className="mt-4">
          <DocsCommandCard title="MNKY Command Docs" icon={FileText} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
