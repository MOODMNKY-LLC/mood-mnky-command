"use client"

import React from "react"

import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  uploadFile,
  saveMediaAsset,
  getPublicUrl,
  type BucketId,
  type MediaAsset,
  BUCKET_CONFIG,
} from "@/lib/supabase/storage"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadedFile {
  file: File
  preview: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
  asset?: MediaAsset
}

export interface UseSupabaseUploadOptions {
  bucket: BucketId
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  linkedEntityType?: string
  linkedEntityId?: string
  tags?: string[]
  onUploadComplete?: (assets: MediaAsset[]) => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSupabaseUpload(options: UseSupabaseUploadOptions) {
  const {
    bucket,
    maxFiles = 10,
    linkedEntityType,
    linkedEntityId,
    tags,
    onUploadComplete,
  } = options

  const config = BUCKET_CONFIG[bucket]
  const maxSizeMB = options.maxSizeMB ?? config.maxSizeMB
  const acceptedTypes = options.acceptedTypes ?? config.acceptedTypes

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ---- Validate a file ----
  const validate = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File exceeds ${maxSizeMB}MB limit`
      }
      if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
        return `File type ${file.type} is not allowed`
      }
      return null
    },
    [maxSizeMB, acceptedTypes],
  )

  // ---- Add files (from input or drop) ----
  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: UploadedFile[] = []
      const arr = Array.from(incoming)

      for (const file of arr) {
        if (files.length + newFiles.length >= maxFiles) break
        const error = validate(file)
        newFiles.push({
          file,
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
          progress: 0,
          status: error ? "error" : "pending",
          error: error ?? undefined,
        })
      }
      setFiles((prev) => [...prev, ...newFiles])
    },
    [files.length, maxFiles, validate],
  )

  // ---- Remove a file by index ----
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const copy = [...prev]
      if (copy[index]?.preview) URL.revokeObjectURL(copy[index].preview)
      copy.splice(index, 1)
      return copy
    })
  }, [])

  // ---- Clear all files ----
  const clearFiles = useCallback(() => {
    for (const f of files) {
      if (f.preview) URL.revokeObjectURL(f.preview)
    }
    setFiles([])
  }, [files])

  // ---- Upload all pending files ----
  const upload = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    setIsUploading(true)
    abortControllerRef.current = new AbortController()
    const completedAssets: MediaAsset[] = []

    const updatedFiles = [...files]

    for (let i = 0; i < updatedFiles.length; i++) {
      const entry = updatedFiles[i]
      if (entry.status !== "pending") continue

      entry.status = "uploading"
      entry.progress = 10
      setFiles([...updatedFiles])

      try {
        // Generate a unique name
        const ext = entry.file.name.split(".").pop() ?? "bin"
        const timestamp = Date.now()
        const safeName = entry.file.name
          .replace(/[^a-zA-Z0-9.-]/g, "_")
          .replace(/_+/g, "_")
        const storageName = `${timestamp}_${safeName}`

        entry.progress = 30
        setFiles([...updatedFiles])

        // Upload to Supabase Storage
        const { path } = await uploadFile(supabase, bucket, user.id, storageName, entry.file, {
          upsert: true,
        })

        entry.progress = 70
        setFiles([...updatedFiles])

        // Get public URL
        const publicUrl = getPublicUrl(supabase, bucket, path)

        // Read image dimensions if it's an image
        let width: number | undefined
        let height: number | undefined
        if (entry.file.type.startsWith("image/") && entry.preview) {
          try {
            const dims = await getImageDimensions(entry.preview)
            width = dims.width
            height = dims.height
          } catch {
            // Non-critical
          }
        }

        // Save metadata
        const asset = await saveMediaAsset(supabase, {
          user_id: user.id,
          bucket_id: bucket,
          storage_path: path,
          file_name: entry.file.name,
          mime_type: entry.file.type,
          file_size: entry.file.size,
          width,
          height,
          tags: tags ?? [],
          public_url: publicUrl,
          linked_entity_type: linkedEntityType,
          linked_entity_id: linkedEntityId,
        })

        entry.progress = 100
        entry.status = "success"
        entry.asset = asset
        completedAssets.push(asset)
      } catch (err) {
        entry.status = "error"
        entry.error = err instanceof Error ? err.message : "Upload failed"
      }

      setFiles([...updatedFiles])
    }

    setIsUploading(false)
    if (completedAssets.length > 0) {
      onUploadComplete?.(completedAssets)
    }

    return completedAssets
  }, [files, bucket, tags, linkedEntityType, linkedEntityId, onUploadComplete])

  // ---- Cancel upload ----
  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsUploading(false)
  }, [])

  // ---- Drag handlers ----
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles],
  )

  const pendingCount = files.filter((f) => f.status === "pending").length
  const successCount = files.filter((f) => f.status === "success").length
  const errorCount = files.filter((f) => f.status === "error").length

  return {
    files,
    isUploading,
    isDragOver,
    pendingCount,
    successCount,
    errorCount,
    addFiles,
    removeFile,
    clearFiles,
    upload,
    cancelUpload,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = url
  })
}
