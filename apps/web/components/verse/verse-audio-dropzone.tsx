"use client"

import { AudioDropzone } from "@/components/studio/audio-dropzone"
import type { MediaAsset } from "@/lib/supabase/storage"
import { cn } from "@/lib/utils"

export interface VerseAudioDropzoneProps {
  maxFiles?: number
  onUploadComplete?: (assets: MediaAsset[]) => void
  compact?: boolean
  className?: string
}

/**
 * Verse-themed AudioDropzone for the storefront profile.
 * Uses verse design tokens (verse-text, verse-text-muted, verse-border, etc.)
 * when rendered inside .verse-storefront.
 */
export function VerseAudioDropzone({
  maxFiles = 100,
  onUploadComplete,
  compact = false,
  className,
}: VerseAudioDropzoneProps) {
  return (
    <div className={cn("verse-audio-dropzone", className)}>
      <AudioDropzone
        maxFiles={maxFiles}
        onUploadComplete={onUploadComplete}
        compact={compact}
      />
    </div>
  )
}
