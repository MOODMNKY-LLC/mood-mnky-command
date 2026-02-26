"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import {
  Upload,
  Trash2,
  ExternalLink,
  ImageIcon,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AppAssetSlotRow } from "@/app/api/app-assets/slots/route"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/** Slot card image: use public URL first so preview works (transform URL may 404 on free tier); try other URL once on error. */
function SlotCardImage({
  currentUrl,
  thumbnailUrl,
}: {
  currentUrl: string | null
  thumbnailUrl: string | null
}) {
  const primary = currentUrl ?? thumbnailUrl ?? ""
  const secondary = currentUrl && thumbnailUrl ? (primary === currentUrl ? thumbnailUrl : currentUrl) : ""
  const [src, setSrc] = useState(primary)
  const [triedFallback, setTriedFallback] = useState(false)
  return (
    <img
      src={src || undefined}
      alt=""
      className="h-full w-full object-cover"
      onError={() => {
        if (!triedFallback && secondary) {
          setTriedFallback(true)
          setSrc(secondary)
        }
      }}
    />
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  "main-services": "Main → Services",
  "main-community": "Main → Community",
  "main-hero": "Main → Hero",
  "main-features": "Main → Features",
}

export default function AppAssetsPage() {
  const [category, setCategory] = useState<string>("all")
  const [selectedSlot, setSelectedSlot] = useState<AppAssetSlotRow | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncingNotion, setSyncingNotion] = useState(false)

  const params = new URLSearchParams()
  if (category !== "all") params.set("category", category)
  const apiUrl = `/api/app-assets/slots?${params.toString()}`

  const { data, isLoading, mutate } = useSWR<{ slots: AppAssetSlotRow[] }>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false }
  )

  const slots = data?.slots ?? []

  const handleUpload = useCallback(
    async (slotKey: string, file: File) => {
      setUploading(slotKey)
      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch(`/api/app-assets/slots/${encodeURIComponent(slotKey)}/upload`, {
          method: "POST",
          body: form,
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || res.statusText)
        }
        const json = await res.json() as { url: string }
        globalMutate(apiUrl)
        setSelectedSlot((prev) =>
          prev?.slot_key === slotKey
            ? { ...prev, current_url: json.url, thumbnail_url: json.url }
            : prev
        )
        mutate()
      } catch (e) {
        console.error(e)
        alert(e instanceof Error ? e.message : "Upload failed")
      } finally {
        setUploading(null)
      }
    },
    [apiUrl, mutate]
  )

  const handleRemove = useCallback(
    async (slotKey: string) => {
      if (!confirm("Remove this image from the slot? The file will be deleted.")) return
      setDeleting(slotKey)
      try {
        const res = await fetch(`/api/app-assets/slots/${encodeURIComponent(slotKey)}`, {
          method: "DELETE",
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || res.statusText)
        }
        globalMutate(apiUrl)
        setSelectedSlot((prev) =>
          prev?.slot_key === slotKey
            ? { ...prev, current_url: null, thumbnail_url: null, media_asset_id: null }
            : prev
        )
        mutate()
      } catch (e) {
        console.error(e)
        alert(e instanceof Error ? e.message : "Remove failed")
      } finally {
        setDeleting(null)
      }
    },
    [apiUrl, mutate]
  )

  const handleSyncFromNotion = useCallback(async () => {
    setSyncingNotion(true)
    try {
      const res = await fetch("/api/app-assets/sync-from-notion", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || res.statusText)
      mutate()
      alert(`Synced ${data.synced ?? 0} slots from Notion.`)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setSyncingNotion(false)
    }
  }, [mutate])

  const byCategory = slots.reduce<Record<string, AppAssetSlotRow[]>>((acc, s) => {
    const c = s.category || "other"
    if (!acc[c]) acc[c] = []
    acc[c].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">App Assets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Single location for editing and uploading all front-end images: Main → Services, Main → Community, and other app-wide slots. Upload or replace to control what appears on the app.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Slots by category</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={syncingNotion}
              onClick={handleSyncFromNotion}
            >
              {syncingNotion ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              Sync from Notion
            </Button>
            <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {[...new Set(slots.map((s) => s.category).filter(Boolean))].map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading slots…</span>
            </div>
          ) : slots.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No slots found.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(byCategory).map(([cat, items]) => (
                <section key={cat}>
                  <h2 className="mb-3 text-sm font-medium text-foreground">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((slot) => (
                      <Card
                        key={slot.id}
                        className="overflow-hidden transition-colors hover:border-border/90"
                      >
                        <div
                          className="flex cursor-pointer flex-col"
                          onClick={() => setSelectedSlot(slot)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setSelectedSlot(slot)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Edit ${slot.label}`}
                        >
                          <div
                            className="relative flex aspect-video w-full items-center justify-center bg-muted/50"
                            style={{ aspectRatio: "16/10" }}
                          >
                            {slot.current_url || slot.thumbnail_url ? (
                              <SlotCardImage
                                key={`${slot.slot_key}-${slot.current_url ?? slot.media_asset_id ?? ""}`}
                                currentUrl={slot.current_url}
                                thumbnailUrl={slot.thumbnail_url}
                              />
                            ) : (
                              <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            )}
                          </div>
                          <CardContent className="p-3">
                            <p className="truncate text-sm font-medium text-foreground">
                              {slot.label}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {slot.slot_key}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSlot(slot)
                                }}
                              >
                                <Upload className="mr-1 h-3 w-3" />
                                Replace
                              </Button>
                              {(slot.current_url || slot.media_asset_id) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-destructive hover:text-destructive"
                                  disabled={deleting === slot.slot_key}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemove(slot.slot_key)
                                  }}
                                >
                                  {deleting === slot.slot_key ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-1 h-3 w-3" />
                                  )}
                                  Remove
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SlotDetailDialog
        slot={selectedSlot}
        open={!!selectedSlot}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
        onUpload={handleUpload}
        onRemove={handleRemove}
        uploading={uploading}
        deleting={deleting}
      />
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SlotDetailDialog({
  slot,
  open,
  onOpenChange,
  onUpload,
  onRemove,
  uploading,
  deleting,
}: {
  slot: AppAssetSlotRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (slotKey: string, file: File) => Promise<void>
  onRemove: (slotKey: string) => Promise<void>
  uploading: string | null
  deleting: string | null
}) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputId = "app-asset-slot-upload"

  useEffect(() => {
    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!open) setFile(null)
  }, [open])

  if (!slot) return null

  const hasImage = !!(slot.current_url || slot.media_asset_id)
  const isImage = file?.type?.startsWith("image/")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{slot.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="mb-1 text-xs text-muted-foreground">Slot</p>
            <p className="font-mono text-sm text-foreground">{slot.slot_key}</p>
            <p className="mt-2 text-xs text-muted-foreground">{slot.route_hint ?? slot.category}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Current image</p>
            {slot.current_url ? (
              <img
                src={slot.thumbnail_url ?? slot.current_url}
                alt=""
                className="max-h-48 w-full rounded object-contain"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded bg-muted/50">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-xs font-medium text-foreground">
              Upload or replace
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:text-xs"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">New image preview</p>
                {previewUrl && isImage ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mb-2 max-h-40 w-full rounded object-contain bg-muted/50"
                  />
                ) : (
                  <div className="mb-2 flex max-h-40 items-center justify-center rounded bg-muted/50 py-8">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <p className="truncate text-xs text-muted-foreground">
                  {file.name} · {formatFileSize(file.size)}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => setFile(null)}
                >
                  Choose different file
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!file || uploading === slot.slot_key}
                onClick={() => file && onUpload(slot.slot_key, file)}
              >
                {uploading === slot.slot_key ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="mr-1 h-3 w-3" />
                )}
                {file ? "Confirm upload" : "Upload"}
              </Button>
              {hasImage && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleting === slot.slot_key}
                  onClick={() => onRemove(slot.slot_key)}
                >
                  {deleting === slot.slot_key ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1 h-3 w-3" />
                  )}
                  Remove image
                </Button>
              )}
            </div>
          </div>

          {slot.notion_page_id && (
            <a
              href={`https://notion.so/${slot.notion_page_id.replace(/-/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Open in Notion
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
