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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUCKET_CONFIG, type MediaAsset } from "@/lib/supabase/storage"

const BUCKET = "mnky-verse-tracks" as const
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB per file
const MAX_BATCH_BYTES = 55 * 1024 * 1024 // 55 MB per request (under 60MB middleware limit)
const ACCEPT = "audio/*,video/mp4"

type FileStatus = "pending" | "uploading" | "success" | "error"

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
  maxFiles = 10,
  onUploadComplete,
  compact = false,
}: AudioDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const extractingRef = useRef<Set<File>>(new Set())
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

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
          setFiles((prev) =>
            prev.map((f) => {
              if (f.file !== entry.file) return f
              const updates: Partial<FileEntry> = {}
              if (picture?.data) updates.coverPreviewUrl = pictureToDataUrl(picture)
              if (audioTitle) updates.audioTitle = audioTitle
              if (audioArtist) updates.audioArtist = audioArtist
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
    setFiles([])
  }, [])

  const upload = useCallback(async () => {
    const pending = files.filter((f) => f.status === "pending")
    if (pending.length === 0) return

    setIsUploading(true)

    // Group into batches so each stays under MAX_BATCH_BYTES
    const batches: FileEntry[][] = []
    let currentBatch: FileEntry[] = []
    let currentSize = 0
    for (const f of pending) {
      if (currentSize + f.file.size > MAX_BATCH_BYTES && currentBatch.length > 0) {
        batches.push(currentBatch)
        currentBatch = []
        currentSize = 0
      }
      currentBatch.push(f)
      currentSize += f.file.size
    }
    if (currentBatch.length > 0) batches.push(currentBatch)

    const allUploadedAssets: MediaAsset[] = []

    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b]
      setUploadProgress({ current: b + 1, total: batches.length })
      setFiles((prev) =>
        prev.map((f, i) => {
          const inBatch = batch.some((bf) => bf.file === f.file)
          return inBatch ? { ...f, status: "uploading" as FileStatus } : f
        })
      )

      try {
        const formData = new FormData()
        if (batch.length === 1) {
          formData.append("file", batch[0].file)
        } else {
          batch.forEach((p) => formData.append("files", p.file))
        }

        const res = await fetch("/api/audio/upload", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "Upload failed")
        }
        const data = await res.json()
        const uploadedAssets: MediaAsset[] = data.asset ? [data.asset] : data.assets ?? []
        allUploadedAssets.push(...uploadedAssets)

        setFiles((prev) => {
          const assetsByBatch = [...uploadedAssets]
          let idx = 0
          return prev.map((f) => {
            const inBatch = batch.some((bf) => bf.file === f.file)
            if (inBatch && f.status === "uploading") {
              const asset = assetsByBatch[idx++]
              return { ...f, status: "success" as FileStatus, asset }
            }
            return f
          })
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        setFiles((prev) =>
          prev.map((f) => {
            const inBatch = batch.some((bf) => bf.file === f.file)
            return inBatch ? { ...f, status: "error" as FileStatus, error: msg } : f
          })
        )
        break
      }
    }

    if (allUploadedAssets.length > 0) onUploadComplete?.(allUploadedAssets)
    setUploadProgress(null)
    setIsUploading(false)
  }, [files, onUploadComplete])

  const pendingCount = files.filter((f) => f.status === "pending").length

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
                <span className="text-[10px] text-muted-foreground">
                  {formatSize(f.file.size)}
                </span>
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
                      ? `Uploading batch ${uploadProgress.current} of ${uploadProgress.total}...`
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
