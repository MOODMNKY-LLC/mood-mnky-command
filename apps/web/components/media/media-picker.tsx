"use client"

import { useState, useCallback } from "react"
import { X, ImageIcon, Plus, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { type BucketId, BUCKET_CONFIG, type MediaAsset } from "@/lib/supabase/storage"

interface MediaPickerProps {
  bucket: BucketId
  label?: string
  maxFiles?: number
  value?: string[]
  onChange?: (urls: string[]) => void
  onAssetsUploaded?: (assets: MediaAsset[]) => void
  linkedEntityType?: string
  linkedEntityId?: string
  tags?: string[]
  compact?: boolean
}

export function MediaPicker({
  bucket,
  label = "Product Images",
  maxFiles = 5,
  value = [],
  onChange,
  onAssetsUploaded,
  linkedEntityType,
  linkedEntityId,
  tags,
  compact = false,
}: MediaPickerProps) {
  const [urls, setUrls] = useState<string[]>(value)

  const upload = useSupabaseUpload({
    bucket,
    maxFiles,
    linkedEntityType,
    linkedEntityId,
    tags,
    onUploadComplete: (assets) => {
      const newUrls = assets
        .filter((a) => a.public_url)
        .map((a) => a.public_url!)
      setUrls((prev) => {
        const updated = [...prev, ...newUrls]
        onChange?.(updated)
        return updated
      })
      onAssetsUploaded?.(assets)
    },
  })

  const removeImage = useCallback(
    (index: number) => {
      setUrls((prev) => {
        const updated = prev.filter((_, i) => i !== index)
        onChange?.(updated)
        return updated
      })
    },
    [onChange]
  )

  const config = BUCKET_CONFIG[bucket]

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-xs text-muted-foreground">{label}</Label>

      {/* Existing images */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div
              key={url}
              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border"
            >
              <img
                src={url || "/placeholder.svg"}
                alt={`Upload ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3 text-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {urls.length < maxFiles && (
        <div
          onDragOver={upload.onDragOver}
          onDragLeave={upload.onDragLeave}
          onDrop={upload.onDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            upload.isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/40"
          } ${compact ? "px-3 py-4" : "px-4 py-6"}`}
        >
          <input
            type="file"
            multiple
            accept={config.acceptedTypes.join(",")}
            onChange={(e) => {
              if (e.target.files?.length) {
                upload.addFiles(e.target.files)
                e.target.value = ""
              }
            }}
            className="hidden"
            id={`media-picker-${bucket}`}
          />
          <label
            htmlFor={`media-picker-${bucket}`}
            className="flex cursor-pointer flex-col items-center gap-1.5"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              Add images (max {config.maxSizeMB}MB each)
            </span>
          </label>
        </div>
      )}

      {/* Pending files */}
      {upload.files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {upload.files.map((f, i) => (
            <div
              key={`${f.file.name}-${i}`}
              className="flex items-center gap-2 rounded border border-border px-2 py-1.5 text-xs"
            >
              {f.preview ? (
                <img
                  src={f.preview || "/placeholder.svg"}
                  alt={f.file.name}
                  className="h-6 w-6 shrink-0 rounded object-cover"
                />
              ) : (
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate text-foreground">{f.file.name}</span>
              {f.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
              {f.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
              {f.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
              {f.status === "pending" && (
                <button type="button" onClick={() => upload.removeFile(i)}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
          {upload.pendingCount > 0 && (
            <Button
              size="sm"
              onClick={upload.upload}
              disabled={upload.isUploading}
              className="mt-1 bg-primary text-primary-foreground text-xs"
            >
              {upload.isUploading ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3 w-3" />
                  Upload {upload.pendingCount} file{upload.pendingCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
