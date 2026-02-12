"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface ImageGenerationProgressProps {
  /** Whether generation is in progress */
  active: boolean
  /** Optional status message */
  message?: string
  /** Whether to show skeleton placeholder for result area */
  showSkeleton?: boolean
  /** Data URL of partial image from streaming (shows progressive preview) */
  partialImageDataUrl?: string | null
  className?: string
}

/**
 * Indeterminate progress indicator for image generation.
 * Uses a shimmer animation since the API does not provide numeric progress.
 * Optionally shows a skeleton placeholder for the result area.
 */
export function ImageGenerationProgress({
  active,
  message = "Generating your image...",
  showSkeleton = true,
  partialImageDataUrl,
  className,
}: ImageGenerationProgressProps) {
  if (!active) return null

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-2">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="absolute h-full w-1/4 min-w-[80px] rounded-full bg-primary animate-progress-indeterminate" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      {(showSkeleton || partialImageDataUrl) && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-2">
            {partialImageDataUrl ? (
              <img
                src={partialImageDataUrl}
                alt="Generating..."
                className="h-24 w-24 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
            )}
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
