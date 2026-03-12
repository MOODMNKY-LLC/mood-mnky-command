"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Film, ImageIcon, Loader2, RefreshCw, Trash2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type GalleryItem = {
  id: string
  media_asset_id: string
  sort_order: number
  ai_description: string | null
  file_name: string
  public_url: string | null
}

export default function PlatformMainMediaPage() {
  const [assetId, setAssetId] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{ items: GalleryItem[] }>(
    "/api/platform/main-media/gallery",
    fetcher,
    { revalidateOnFocus: false }
  )

  const items = data?.items ?? []

  const handleAdd = async () => {
    const id = assetId.trim()
    if (!id) return
    setAddError(null)
    setAdding(true)
    try {
      const res = await fetch("/api/platform/main-media/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_asset_id: id }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAddError(json.error ?? "Failed to add")
        return
      }
      setAssetId("")
      mutate()
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this item from the gallery?")) return
    const res = await fetch(`/api/platform/main-media/gallery/${id}`, {
      method: "DELETE",
    })
    if (res.ok) mutate()
  }

  const handleRegenerate = async (id: string) => {
    const res = await fetch(
      `/api/main/media/gallery/${id}/regenerate-description`,
      { method: "POST" }
    )
    if (res.ok) mutate()
  }

  const jellyfinBase = process.env.NEXT_PUBLIC_JELLYFIN_BASE_URL ?? process.env.JELLYFIN_BASE_URL

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Main Media
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage gallery items and featured content for the Main site Media
          page. Public page:{" "}
          <Link
            href="/main/media"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            /main/media
          </Link>
          <ExternalLink className="ml-1 inline h-3 w-3" />
        </p>
      </div>

      {/* Featured Jellyfin */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Film className="h-4 w-4 text-primary" />
            Featured Jellyfin
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {jellyfinBase ? (
            <p>
              Base URL: <code className="rounded bg-muted px-1">{jellyfinBase}</code>
              . Featured items use default (random 6). Configure{" "}
              <code className="rounded bg-muted px-1">JELLYFIN_USER_ID</code> in
              env if needed.{" "}
              <a
                href={jellyfinBase.startsWith("http") ? jellyfinBase : `https://${jellyfinBase}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open Jellyfin →
              </a>
            </p>
          ) : (
            <p>
              Set <code className="rounded bg-muted px-1">JELLYFIN_BASE_URL</code>{" "}
              and <code className="rounded bg-muted px-1">JELLYFIN_API_KEY</code>{" "}
              to show featured content on the Media page.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Art gallery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="asset-id">Add by media asset ID</Label>
              <Input
                id="asset-id"
                placeholder="UUID from Media Library"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="font-mono text-sm max-w-xs"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={adding || !assetId.trim()}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
            <Link href="/media" className="text-sm text-primary hover:underline">
              Open Media Library to copy asset IDs →
            </Link>
          </div>
          {addError && (
            <p className="text-sm text-destructive">{addError}</p>
          )}

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : error ? (
            <p className="text-sm text-muted-foreground">
              Failed to load gallery entries.
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No gallery items yet. Add media assets above (use IDs from Media
              Library).
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="aspect-square w-full bg-muted">
                    {item.public_url ? (
                      <img
                        src={item.public_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.ai_description || "No description. Regenerate to add one."}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      {item.media_asset_id}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerate(item.id)}
                        className="gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(item.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <Link href="/platform" className="text-primary hover:underline">
          ← Platform
        </Link>
      </p>
    </div>
  )
}
