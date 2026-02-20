"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Download, RefreshCw } from "lucide-react"

export interface VideoPreviewProps {
  videoId: string
  /** Optional: URL of saved asset in media (e.g. from ai-videos bucket) */
  assetUrl?: string | null
  /** Prompt used for generation */
  prompt?: string | null
  /** Called when user clicks Remix */
  onRemix?: (videoId: string) => void
  className?: string
}

/**
 * Displays a completed video with play, download, copy URL, and remix actions.
 */
export function VideoPreview({
  videoId,
  assetUrl,
  prompt,
  onRemix,
  className,
}: VideoPreviewProps) {
  const [copied, setCopied] = useState(false)

  const contentUrl = assetUrl ?? `/api/videos/${videoId}/content`
  const downloadUrl = `${contentUrl}${assetUrl ? "" : "?save=true"}`

  const handleCopyUrl = () => {
    const url = assetUrl ?? `${window.location.origin}/api/videos/${videoId}/content`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium">Generated Video</p>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <video
            src={contentUrl}
            controls
            className="h-full w-full object-contain"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        {prompt && (
          <p className="text-xs text-muted-foreground line-clamp-2">{prompt}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            asChild
          >
            <a href={downloadUrl} download={`video-${videoId}.mp4`}>
              <Download className="h-3 w-3" />
              Download
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleCopyUrl}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied" : "Copy URL"}
          </Button>
          {onRemix && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => onRemix(videoId)}
            >
              <RefreshCw className="h-3 w-3" />
              Remix
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
