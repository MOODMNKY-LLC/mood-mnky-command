"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import jsmediatags from "jsmediatags"
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileAudio,
  RefreshCw,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUCKET_CONFIG, getPublicUrl, uploadFile, type MediaAsset } from "@/lib/supabase/storage"
import { createClient } from "@/lib/supabase/client"

const BUCKET = "mnky-verse-tracks" as const
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB per file
const ACCEPT = "audio/*,video/mp4"

type FileStatus = "pending" | "uploading" | "success" | "error"

type DuplicateAction = "replace" | "skip"

interface FileEntry {
  file: File
  status: FileStatus
  error?: string
  asset?: MediaAsset
  /** Client-extracted cover preview (blob URL) */
  coverPreviewUrl?: string | null
  /** Client-extracted metadata for display */
  audioTitle?: string | null
  audioArtist?: string | null
  audioAlbum?: string | null
  /** Duplicate: file_name already exists in library */
  isDuplicate?: boolean
  existingAssetId?: string
  duplicateAction?: DuplicateAction
}

function pictureToDataUrl(picture: { data: number[] | Uint8Array; format?: string }): string {
  const bytes = picture.data instanceof Uint8Array ? Array.from(picture.data) : picture.data
  let binary = ""
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk))
  }
  const base64 = btoa(binary)
  const raw = (picture.format ?? "jpeg").toString().toLowerCase()
  const mime = raw.startsWith("image/") ? raw : `image/${raw === "jpg" ? "jpeg" : raw}`
  return `data:${mime};base64,${base64}`
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) return `Exceeds 50 MB limit`
  const config = BUCKET_CONFIG[BUCKET]
  if (config?.acceptedTypes?.length && !config.acceptedTypes.includes(file.type)) {
    return `Type ${file.type} not allowed`
  }
  return null
}

export interface AudioDropzoneProps {
  maxFiles?: number
  onUploadComplete?: (assets: MediaAsset[]) => void
  compact?: boolean
}

export function AudioDropzone({
  maxFiles = 100,
  onUploadComplete,
  compact = false,
}: AudioDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const extractingRef = useRef<Set<File>>(new Set())
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [hasCheckedDuplicates, setHasCheckedDuplicates] = useState(false)

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming)
      const newEntries: FileEntry[] = []
      for (const file of arr) {
        if (files.length + newEntries.length >= maxFiles) break
        const err = validateFile(file)
        newEntries.push({
          file,
          status: err ? "error" : "pending",
          error: err ?? undefined,
        })
      }
      if (newEntries.length > 0) {
        setHasCheckedDuplicates(false)
        setFiles((prev) => [...prev, ...newEntries])
      }
    },
    [files.length, maxFiles]
  )

  // Extract cover art and metadata for preview when files are added
  useEffect(() => {
    files.forEach((entry) => {
      if (
        entry.status === "error" ||
        entry.coverPreviewUrl ||
        entry.asset?.cover_art_url ||
        extractingRef.current.has(entry.file)
      )
        return
      extractingRef.current.add(entry.file)
      jsmediatags.read(entry.file, {
        onSuccess: (tag) => {
          const raw = tag.tags?.picture
          const picture = Array.isArray(raw) ? raw[0] : raw
          const audioTitle = tag.tags?.title
          const audioArtist = tag.tags?.artist
          const audioAlbum = tag.tags?.album
          setFiles((prev) =>
            prev.map((f) => {
              if (f.file !== entry.file) return f
              const updates: Partial<FileEntry> = {}
              if (picture?.data) updates.coverPreviewUrl = pictureToDataUrl(picture)
              if (audioTitle) updates.audioTitle = audioTitle
              if (audioArtist) updates.audioArtist = audioArtist
              if (audioAlbum) updates.audioAlbum = audioAlbum
              return { ...f, ...updates }
            })
          )
        },
        onError: () => {},
      })
    })
  }, [files])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearAll = useCallback(() => {
    extractingRef.current.clear()
    setHasCheckedDuplicates(false)
    setFiles([])
  }, [])

  const setDuplicateAction = useCallback((index: number, action: DuplicateAction) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, duplicateAction: action } : f))
    )
  }, [])

  const upload = useCallback(async () => {
    const pending = files.filter((f) => f.status === "pending")
    if (pending.length === 0) return

    // Phase 1: Check duplicates if not yet done
    if (!hasCheckedDuplicates) {
      setHasCheckedDuplicates(true)
      try {
        const res = await fetch("/api/media/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket: BUCKET,
            fileNames: pending.map((f) => f.file.name),
          }),
        })
        if (!res.ok) throw new Error("Duplicate check failed")
        const { existing } = (await res.json()) as { existing: { id: string; file_name: string }[] }
        const byName = new Map(existing.map((e) => [e.file_name, e.id]))
        setFiles((prev) =>
          prev.map((f) => {
            if (f.status !== "pending") return f
            const exId = byName.get(f.file.name)
            return exId
              ? { ...f, isDuplicate: true, existingAssetId: exId, duplicateAction: "skip" as const }
              : f
          })
        )
        const duplicateCount = byName.size
        if (duplicateCount > 0) return // Show UI; user will click Upload again after choosing
      } catch {
        setFiles((prev) => prev) // Proceed without duplicate info
      }
    }

    // Phase 2: Build queue and upload sequentially (one file per request)
    const toUpload: FileEntry[] = []
    for (const f of pending) {
      if (f.isDuplicate && f.duplicateAction === "skip") continue
      toUpload.push(f)
    }

    if (toUpload.length === 0) return

    setIsUploading(true)
    const allUploadedAssets: MediaAsset[] = []
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "pending" ? { ...f, status: "error", error: "Unauthorized" } : f
        )
      )
      setUploadProgress(null)
      setIsUploading(false)
      return
    }

    for (let i = 0; i < toUpload.length; i++) {
      const entry = toUpload[i]
      setUploadProgress({ current: i + 1, total: toUpload.length })
      setFiles((prev) =>
        prev.map((f) =>
          f.file === entry.file ? { ...f, status: "uploading" as FileStatus } : f
        )
      )

      try {
        if (entry.isDuplicate && entry.duplicateAction === "replace" && entry.existingAssetId) {
          await fetch(`/api/media/${entry.existingAssetId}`, { method: "DELETE" })
        }

        // Upload directly to Supabase Storage to avoid Vercel request body limits in production.
        const safeName = entry.file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "audio"
        const uniqueId = crypto.randomUUID()
        const storageFileName = `${uniqueId}-${safeName}`

        const { path } = await uploadFile(
          supabase,
          BUCKET,
          user.id,
          storageFileName,
          entry.file,
          { contentType: entry.file.type }
        )
        const publicUrl = getPublicUrl(supabase, BUCKET, path)

        let coverArtPath: string | null = null
        let coverArtUrl: string | null = null
        if (entry.coverPreviewUrl?.startsWith("data:")) {
          const coverBlob = await fetch(entry.coverPreviewUrl).then((r) => r.blob())
          const mime = coverBlob.type || "image/jpeg"
          const ext =
            mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"
          const cover = await uploadFile(
            supabase,
            BUCKET,
            user.id,
            `covers/${uniqueId}-cover.${ext}`,
            coverBlob,
            { contentType: mime }
          )
          coverArtPath = cover.path
          coverArtUrl = getPublicUrl(supabase, BUCKET, cover.path)
        }

        // Register metadata row via API (small JSON payload, keeps RLS enforcement)
        const registerRes = await fetch("/api/audio/register-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket_id: BUCKET,
            storage_path: path,
            file_name: entry.file.name,
            mime_type: entry.file.type,
            file_size: entry.file.size,
            public_url: publicUrl,
            category: "verse-track",
            audio_title: entry.audioTitle ?? null,
            audio_artist: entry.audioArtist ?? null,
            audio_album: entry.audioAlbum ?? null,
            cover_art_path: coverArtPath,
            cover_art_url: coverArtUrl,
          }),
        })
        if (!registerRes.ok) {
          const data = await registerRes.json().catch(() => ({}))
          throw new Error(data.error ?? "Failed to register upload")
        }
        const regData = (await registerRes.json()) as { asset: MediaAsset }
        const asset = regData.asset
        allUploadedAssets.push(asset)

        setFiles((prev) =>
          prev.map((f) =>
            f.file === entry.file
              ? { ...f, status: "success" as FileStatus, asset }
              : f
          )
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        setFiles((prev) =>
          prev.map((f) =>
            f.file === entry.file
              ? { ...f, status: "error" as FileStatus, error: msg }
              : f
          )
        )
      }
    }

    if (allUploadedAssets.length > 0) onUploadComplete?.(allUploadedAssets)
    setUploadProgress(null)
    setIsUploading(false)
  }, [files, hasCheckedDuplicates, onUploadComplete])

  const pendingCount = files.filter((f) => f.status === "pending").length
  const duplicateCount = files.filter((f) => f.status === "pending" && f.isDuplicate).length

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const dropped = e.dataTransfer.files
      if (dropped.length) addFiles(dropped)
    },
    [addFiles]
  )

  const config = BUCKET_CONFIG[BUCKET]

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-muted-foreground/40 hover:bg-accent/50"
        } ${compact ? "px-4 py-6" : "px-6 py-10"}`}
      >
        <Upload className={`text-muted-foreground ${compact ? "h-6 w-6 mb-2" : "h-8 w-8 mb-3"}`} />
        <p className={`font-medium text-foreground ${compact ? "text-xs" : "text-sm"}`}>
          {isDragOver ? "Drop audio here" : "Click or drag audio to upload"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          MP3, WAV, FLAC, MP4 — max {config?.maxSizeMB ?? 50} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={(e) => {
            if (e.target.files?.length) {
              addFiles(e.target.files)
              e.target.value = ""
            }
          }}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {duplicateCount > 0 && hasCheckedDuplicates && (
            <p className="rounded-md border border-amber-500/50 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400">
              {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} — choose Replace or Skip, then click Upload
            </p>
          )}
          {files.map((f, i) => (
            <div
              key={`${f.file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              {f.coverPreviewUrl || f.asset?.cover_art_url ? (
                <img
                  src={f.coverPreviewUrl ?? f.asset?.cover_art_url ?? ""}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded object-cover bg-secondary"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary">
                  <FileAudio className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-xs font-medium text-foreground">
                  {f.audioTitle ?? f.asset?.audio_title ?? f.file.name}
                </span>
                {(f.audioArtist ?? f.asset?.audio_artist) && (
                  <span className="truncate text-[10px] text-muted-foreground">
                    {f.audioArtist ?? f.asset?.audio_artist}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {formatSize(f.file.size)}
                  </span>
                  {f.isDuplicate && f.status === "pending" && (
                    <span className="rounded bg-amber-500/20 px-1 text-[10px] text-amber-600 dark:text-amber-400">
                      Duplicate
                    </span>
                  )}
                </div>
                {f.isDuplicate && f.status === "pending" && (
                  <div className="mt-0.5 flex gap-1">
                    <Button
                      variant={f.duplicateAction === "replace" ? "default" : "outline"}
                      size="sm"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() => setDuplicateAction(i, "replace")}
                    >
                      <RefreshCw className="mr-0.5 h-3 w-3" />
                      Replace
                    </Button>
                    <Button
                      variant={f.duplicateAction === "skip" ? "default" : "outline"}
                      size="sm"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() => setDuplicateAction(i, "skip")}
                    >
                      <Ban className="mr-0.5 h-3 w-3" />
                      Skip
                    </Button>
                  </div>
                )}
                {f.status === "error" && f.error && (
                  <span className="text-[10px] text-destructive">{f.error}</span>
                )}
              </div>
              <div className="shrink-0">
                {f.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {f.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {f.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                {f.status === "pending" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(i)
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isUploading}
              className="text-xs text-muted-foreground"
            >
              Clear all
            </Button>
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={upload}
                disabled={isUploading}
                className="text-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    {uploadProgress
                      ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`
                      : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3 w-3" />
                    Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
