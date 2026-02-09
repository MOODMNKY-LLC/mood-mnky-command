"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import {
  Search,
  Grid3X3,
  List,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  X,
  ImageIcon,
  Film,
  FileIcon,
  Tag,
  Info,
  LayoutGrid,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Dropzone } from "@/components/media/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import {
  BUCKET_CONFIG,
  type BucketId,
  type MediaAsset,
} from "@/lib/supabase/storage"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const BUCKET_IDS = Object.keys(BUCKET_CONFIG) as BucketId[]

function formatSize(bytes: number | null) {
  if (!bytes) return "--"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MimeIcon({ mime }: { mime: string | null }) {
  if (mime?.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
  if (mime?.startsWith("video/")) return <Film className="h-4 w-4" />
  return <FileIcon className="h-4 w-4" />
}

export default function MediaLibraryPage() {
  const [activeBucket, setActiveBucket] = useState<BucketId | "all">("all")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingTags, setEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState("")

  // Active upload bucket
  const [uploadBucket, setUploadBucket] = useState<BucketId>("product-images")

  const queryParams = new URLSearchParams()
  if (activeBucket !== "all") queryParams.set("bucket", activeBucket)
  if (activeCategory !== "all") queryParams.set("category", activeCategory)
  if (search) queryParams.set("search", search)
  queryParams.set("limit", "100")
  const apiUrl = `/api/media?${queryParams.toString()}`

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const assets: MediaAsset[] = data?.assets ?? []
  const totalCount: number = data?.count ?? 0

  const { data: fragranceData } = useSWR<{
    fragranceOils: { id: string; name: string; notionId?: string | null }[]
  }>("/api/fragrance-oils", fetcher)
  const fragranceOils = fragranceData?.fragranceOils ?? []

  const upload = useSupabaseUpload({
    bucket: uploadBucket,
    onUploadComplete: () => {
      globalMutate(apiUrl)
    },
  })

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }, [])

  const handleDelete = useCallback(
    async (asset: MediaAsset) => {
      setDeleting(asset.id)
      try {
        await fetch(`/api/media/${asset.id}`, { method: "DELETE" })
        globalMutate(apiUrl)
        if (selectedAsset?.id === asset.id) setSelectedAsset(null)
      } catch {
        // Error handling
      }
      setDeleting(null)
    },
    [apiUrl, selectedAsset]
  )

  const handleAssignToFragrance = useCallback(
    async (asset: MediaAsset, fragranceId: string) => {
      const oil = fragranceOils.find((o) => o.id === fragranceId)
      if (!oil) return
      setUpdating(asset.id)
      try {
        await fetch(`/api/media/${asset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linked_entity_type: "fragrance",
            linked_entity_id: fragranceId,
          }),
        })
        mutate()
        setSelectedAsset((prev) =>
          prev?.id === asset.id
            ? { ...prev, linked_entity_type: "fragrance", linked_entity_id: fragranceId }
            : prev
        )
      } catch {
        // Error handling
      }
      setUpdating(null)
    },
    [fragranceOils, mutate]
  )

  const handleUpdateTags = useCallback(
    async (asset: MediaAsset, newTags: string[]) => {
      setUpdating(asset.id)
      try {
        await fetch(`/api/media/${asset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: newTags }),
        })
        mutate()
        setSelectedAsset((prev) => (prev?.id === asset.id ? { ...prev, tags: newTags } : prev))
      } catch {
        // Error handling
      }
      setUpdating(null)
    },
    [mutate]
  )

  const handleSyncToNotion = useCallback(
    async (asset: MediaAsset) => {
      const fragranceId = asset.linked_entity_id
      const oil = fragranceOils.find((o) => o.id === fragranceId)
      const notionId = oil?.notionId
      if (!notionId || !asset.public_url) return
      setSyncing(asset.id)
      try {
        const res = await fetch("/api/notion/update-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notionPageId: notionId, imageUrl: asset.public_url }),
        })
        if (!res.ok) throw new Error((await res.json()).error)
      } catch {
        // Error handling
      }
      setSyncing(null)
    },
    [fragranceOils]
  )

  const CATEGORIES = [
    { value: "all", label: "All" },
    { value: "fragrance-scene", label: "Fragrance Scene" },
    { value: "product", label: "Product" },
    { value: "mascot", label: "Mascot" },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Media Library
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload, organize, and manage all media assets across your application.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main content */}
        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Bucket filter tabs */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveBucket("all")}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeBucket === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {BUCKET_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveBucket(id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    activeBucket === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {BUCKET_CONFIG[id].label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-48 pl-8 text-xs"
                />
              </div>

              {/* View toggle */}
              <div className="flex items-center rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-l-md p-1.5 ${viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-r-md p-1.5 ${viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Count bar */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>
              {isLoading ? "Loading..." : `${totalCount} asset${totalCount !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Assets grid/list */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">No assets yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload files using the panel on the right
                </p>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAsset(asset)}
                  className={`group relative flex aspect-square flex-col overflow-hidden rounded-lg border transition-all hover:ring-2 hover:ring-primary/50 ${
                    selectedAsset?.id === asset.id
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-border"
                  }`}
                >
                  {asset.mime_type?.startsWith("image/") && asset.public_url ? (
                    <img
                      src={asset.public_url || "/placeholder.svg"}
                      alt={asset.alt_text || asset.file_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <MimeIcon mime={asset.mime_type} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-[10px] font-medium text-white">
                      {asset.file_name}
                    </p>
                    <p className="text-[9px] text-white/70">{formatSize(asset.file_size)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAsset(asset)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent ${
                    selectedAsset?.id === asset.id ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  {asset.mime_type?.startsWith("image/") && asset.public_url ? (
                    <img
                      src={asset.public_url || "/placeholder.svg"}
                      alt={asset.alt_text || asset.file_name}
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary">
                      <MimeIcon mime={asset.mime_type} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{asset.file_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(asset.file_size)} -- {BUCKET_CONFIG[asset.bucket_id as BucketId]?.label ?? asset.bucket_id}
                    </p>
                  </div>
                  {asset.tags?.length > 0 && (
                    <div className="flex gap-1">
                      {asset.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: Upload + Details */}
        <div className="flex flex-col gap-4">
          {/* Upload card */}
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Upload</CardTitle>
                <select
                  value={uploadBucket}
                  onChange={(e) => setUploadBucket(e.target.value as BucketId)}
                  className="h-7 rounded-md border border-border bg-card px-2 text-[11px] text-foreground"
                >
                  {BUCKET_IDS.map((id) => (
                    <option key={id} value={id}>
                      {BUCKET_CONFIG[id].label}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <Dropzone
                bucket={uploadBucket}
                files={upload.files}
                isDragOver={upload.isDragOver}
                isUploading={upload.isUploading}
                onDragOver={upload.onDragOver}
                onDragLeave={upload.onDragLeave}
                onDrop={upload.onDrop}
                onFilesSelected={(f) => upload.addFiles(f)}
                onRemoveFile={upload.removeFile}
                onUpload={upload.upload}
                onClear={upload.clearFiles}
                pendingCount={upload.pendingCount}
                compact
              />
            </CardContent>
          </Card>

          {/* Bucket stats */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Buckets</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex flex-col gap-2">
                {BUCKET_IDS.map((id) => {
                  const bucketAssets = activeBucket === "all"
                    ? assets.filter((a) => a.bucket_id === id)
                    : activeBucket === id
                      ? assets
                      : []
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveBucket(id)}
                      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                        activeBucket === id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <span className="font-medium">{BUCKET_CONFIG[id].label}</span>
                      <span className="tabular-nums">
                        {activeBucket === "all" ? bucketAssets.length : activeBucket === id ? totalCount : "--"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Asset detail dialog */}
      <Dialog
        open={!!selectedAsset}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAsset(null)
            setEditingTags(false)
            setTagInput("")
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedAsset && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm truncate">{selectedAsset.file_name}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
                {/* Preview */}
                <div className="flex items-center justify-center rounded-lg bg-secondary/50 p-4">
                  {selectedAsset.mime_type?.startsWith("image/") && selectedAsset.public_url ? (
                    <img
                      src={selectedAsset.public_url || "/placeholder.svg"}
                      alt={selectedAsset.alt_text || selectedAsset.file_name}
                      className="max-h-[400px] rounded object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-12">
                      <MimeIcon mime={selectedAsset.mime_type} />
                      <span className="text-xs text-muted-foreground">{selectedAsset.mime_type}</span>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-col gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Bucket</span>
                    <p className="font-medium text-foreground">
                      {BUCKET_CONFIG[selectedAsset.bucket_id as BucketId]?.label ?? selectedAsset.bucket_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size</span>
                    <p className="font-medium text-foreground">{formatSize(selectedAsset.file_size)}</p>
                  </div>
                  {selectedAsset.width && selectedAsset.height && (
                    <div>
                      <span className="text-muted-foreground">Dimensions</span>
                      <p className="font-medium text-foreground">
                        {selectedAsset.width} x {selectedAsset.height}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium text-foreground">{selectedAsset.mime_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uploaded</span>
                    <p className="font-medium text-foreground">
                      {new Date(selectedAsset.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {selectedAsset.category && (
                    <div>
                      <span className="text-muted-foreground">Category</span>
                      <p className="font-medium text-foreground capitalize">
                        {selectedAsset.category.replace(/-/g, " ")}
                      </p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tags</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTags(!editingTags)
                          setTagInput("")
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        {editingTags ? "Done" : "Edit"}
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedAsset.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[9px] group/tag"
                        >
                          <Tag className="mr-0.5 h-2.5 w-2.5" />
                          {tag}
                          {editingTags && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTags(
                                  selectedAsset,
                                  selectedAsset.tags.filter((t) => t !== tag)
                                )
                              }
                              disabled={updating === selectedAsset.id}
                              className="ml-1 rounded hover:bg-destructive/20 px-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {editingTags && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const t = tagInput.trim()
                            if (t && !selectedAsset.tags.includes(t)) {
                              handleUpdateTags(selectedAsset, [...selectedAsset.tags, t])
                              setTagInput("")
                            }
                          }}
                          className="flex gap-1"
                        >
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Add tag"
                            className="h-6 w-20 text-[10px] px-1.5"
                          />
                          <Button type="submit" size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]">
                            Add
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Assign to Fragrance + Sync to Notion */}
              {fragranceOils.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">Assign to:</span>
                    <select
                      value={selectedAsset.linked_entity_type === "fragrance" ? selectedAsset.linked_entity_id ?? "" : ""}
                      onChange={(e) => {
                        const id = e.target.value
                        if (id) handleAssignToFragrance(selectedAsset, id)
                      }}
                      disabled={updating === selectedAsset.id}
                      className="h-8 flex-1 rounded-md border border-border bg-card px-2.5 text-xs text-foreground"
                    >
                      <option value="">Select fragrance...</option>
                      {fragranceOils.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedAsset.linked_entity_type === "fragrance" &&
                    selectedAsset.linked_entity_id &&
                    fragranceOils.some((o) => o.id === selectedAsset.linked_entity_id && o.notionId) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent w-full"
                        disabled={syncing === selectedAsset.id || !selectedAsset.public_url}
                        onClick={() => handleSyncToNotion(selectedAsset)}
                      >
                        {syncing === selectedAsset.id ? "Syncing..." : "Sync URL to Notion"}
                      </Button>
                    )}
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex items-center gap-2">
                {selectedAsset.public_url && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent"
                      onClick={() => handleCopyUrl(selectedAsset.public_url!)}
                    >
                      {copiedUrl ? (
                        <Check className="mr-1.5 h-3 w-3 text-success" />
                      ) : (
                        <Copy className="mr-1.5 h-3 w-3" />
                      )}
                      {copiedUrl ? "Copied" : "Copy URL"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent"
                      asChild
                    >
                      <a href={selectedAsset.public_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-3 w-3" />
                        Open
                      </a>
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto text-xs text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
                  disabled={deleting === selectedAsset.id}
                  onClick={() => handleDelete(selectedAsset)}
                >
                  <Trash2 className="mr-1.5 h-3 w-3" />
                  {deleting === selectedAsset.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
