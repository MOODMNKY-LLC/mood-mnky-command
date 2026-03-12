"use client"

import useSWR from "swr"
import { BookOpen, ExternalLink, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Entry = {
  id: string
  notion_page_id: string | null
  notion_database_id: string | null
  title: string
  category: string
  content_markdown: string | null
  content_code: string | null
  source: string
  synced_at: string
  created_at: string
  updated_at: string
}

const NOTION_PAGE_URL = (pageId: string) =>
  `https://www.notion.so/${pageId.replace(/-/g, "")}`

export default function PlatformMnkyMindPage() {
  const { data: entries, isLoading, error, mutate } = useSWR<Entry[]>(
    "/api/labz/mnky-mind",
    fetcher,
    { revalidateOnFocus: false },
  )
  const { toast } = useToast()

  const handleSync = async () => {
    try {
      const res = await fetch("/api/labz/mnky-mind", { method: "POST" })
      const body = await res.json()
      if (!res.ok) {
        toast({
          title: "Sync failed",
          description: body.error ?? "Could not sync from Notion.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Sync complete",
        description: `Synced ${body.synced ?? 0} of ${body.total ?? 0} entries from Notion.`,
      })
      mutate()
    } catch {
      toast({
        title: "Sync failed",
        description: "Network or server error.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            MNKY MIND
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Collective databases synced from Notion. Two-way sync: pull from Notion here; edit in Notion to refresh.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync from Notion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entries</CardTitle>
          <p className="text-sm text-muted-foreground">
            Source:{" "}
            <a
              href="https://www.notion.so/mood-mnky/MNKY_MIND-Databases-2e1cd2a654228009920ee6fa51188f46"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              MNKY_MIND Databases
              <ExternalLink className="h-3 w-3" />
            </a>
            . Set <code className="text-xs bg-muted px-1 rounded">NOTION_API_KEY</code> and share the database with your integration to enable sync.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">Failed to load entries.</p>
          ) : !entries?.length ? (
            <p className="text-sm text-muted-foreground">
              No entries yet. Click &quot;Sync from Notion&quot; to pull from the MNKY_MIND database (requires Notion integration).
            </p>
          ) : (
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-border p-4 flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{entry.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground capitalize">
                        {entry.category}
                      </span>
                      {entry.notion_page_id && (
                        <a
                          href={NOTION_PAGE_URL(entry.notion_page_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Open in Notion
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {entry.content_markdown && (
                    <div className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                      {entry.content_markdown.slice(0, 300)}
                      {entry.content_markdown.length > 300 ? "…" : ""}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Synced {new Date(entry.synced_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
