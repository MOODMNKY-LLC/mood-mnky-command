"use client"

import React from "react"

import { useRef } from "react"
import { Upload, X, CheckCircle2, AlertCircle, Loader2, FileIcon, ImageIcon, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { type UploadedFile } from "@/hooks/use-supabase-upload"
import { BUCKET_CONFIG, type BucketId } from "@/lib/supabase/storage"

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-muted-foreground" />
  if (mime.startsWith("video/")) return <Film className="h-5 w-5 text-muted-foreground" />
  return <FileIcon className="h-5 w-5 text-muted-foreground" />
}

interface DropzoneProps {
  bucket: BucketId
  files: UploadedFile[]
  isDragOver: boolean
  isUploading: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFilesSelected: (files: FileList | File[]) => void
  onRemoveFile: (index: number) => void
  onUpload: () => void
  onClear: () => void
  pendingCount: number
  compact?: boolean
}

export function Dropzone({
  bucket,
  files,
  isDragOver,
  isUploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFilesSelected,
  onRemoveFile,
  onUpload,
  onClear,
  pendingCount,
  compact = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const config = BUCKET_CONFIG[bucket]

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
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
          {isDragOver ? "Drop files here" : "Click or drag files to upload"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {config.label} -- max {config.maxSizeMB}MB
          {config.acceptedTypes.length > 0 && (
            <span className="block mt-0.5">
              {config.acceptedTypes.map((t) => t.split("/")[1]).join(", ")}
            </span>
          )}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={config.acceptedTypes.length > 0 ? config.acceptedTypes.join(",") : undefined}
          onChange={(e) => {
            if (e.target.files?.length) {
              onFilesSelected(e.target.files)
              e.target.value = ""
            }
          }}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f, i) => (
            <div
              key={`${f.file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              {/* Preview or icon */}
              {f.preview ? (
                <img
                  src={f.preview || "/placeholder.svg"}
                  alt={f.file.name}
                  className="h-10 w-10 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary">
                  <FileTypeIcon mime={f.file.type} />
                </div>
              )}

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-xs font-medium text-foreground">
                  {f.file.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatSize(f.file.size)}
                </span>
                {f.status === "uploading" && (
                  <Progress value={f.progress} className="h-1" />
                )}
                {f.status === "error" && f.error && (
                  <span className="text-[10px] text-destructive">{f.error}</span>
                )}
              </div>

              {/* Status indicator */}
              <div className="shrink-0">
                {f.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {f.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
                {f.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                {f.status === "pending" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveFile(i)
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={isUploading}
              className="text-xs text-muted-foreground"
            >
              Clear all
            </Button>
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={onUpload}
                disabled={isUploading}
                className="bg-primary text-primary-foreground text-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Uploading...
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
