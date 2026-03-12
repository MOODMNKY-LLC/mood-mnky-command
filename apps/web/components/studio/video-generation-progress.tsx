"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface VideoJob {
  id: string
  status: "queued" | "in_progress" | "completed" | "failed"
  progress: number
  error?: { code: string; message: string } | null
  prompt?: string | null
  size?: string
  seconds?: string
  model?: string
}

export interface VideoGenerationProgressProps {
  /** Video job ID to poll */
  videoId: string | null
  /** Whether polling is active */
  active: boolean
  /** Optional status message */
  message?: string
  /** Called when video completes (with job) or fails */
  onComplete?: (job: VideoJob) => void
  /** Poll interval in ms */
  pollInterval?: number
  className?: string
}

/**
 * Polls video job status and displays progress.
 * Shows progress bar, status text, and optional preview when completed.
 */
export function VideoGenerationProgress({
  videoId,
  active,
  message = "Creating your video. This may take 1–3 minutes...",
  onComplete,
  pollInterval = 3000,
  className,
}: VideoGenerationProgressProps) {
  const [job, setJob] = useState<VideoJob | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active || !videoId) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`)
        if (!res.ok) throw new Error("Failed to fetch status")
        const data = (await res.json()) as VideoJob
        setJob(data)

        if (data.status === "completed" || data.status === "failed") {
          onComplete?.(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Poll failed")
      }
    }

    poll()
    const interval = setInterval(poll, pollInterval)
    return () => clearInterval(interval)
  }, [active, videoId, pollInterval, onComplete])

  if (!active || !videoId) return null

  const progress = job?.progress ?? 0
  const statusText =
    job?.status === "queued"
      ? "Queued..."
      : job?.status === "in_progress"
        ? `${progress}%`
        : job?.status === "failed"
          ? "Failed"
          : job?.status === "completed"
            ? "Completed"
            : "Starting..."

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-2">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {message} {statusText}
        </p>
        {job?.error && (
          <p className="text-sm text-destructive">{job.error.message}</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
