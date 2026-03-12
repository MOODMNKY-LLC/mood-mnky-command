"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Video, Loader2, RefreshCw, Film } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BrandAssetReferencePicker } from "@/components/studio/brand-asset-reference-picker"
import { VideoGenerationProgress } from "@/components/studio/video-generation-progress"
import { VideoPreview } from "@/components/studio/video-preview"
import type { VideoJob } from "@/components/studio/video-generation-progress"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const VIDEO_SIZES = [
  { value: "1280x720", label: "Landscape (1280×720)" },
  { value: "720x1280", label: "Portrait (720×1280)" },
  { value: "1792x1024", label: "Wide (1792×1024)" },
  { value: "1024x1792", label: "Tall (1024×1792)" },
] as const

const VIDEO_SECONDS = [
  { value: "4", label: "4 seconds" },
  { value: "8", label: "8 seconds" },
  { value: "12", label: "12 seconds" },
] as const

function VideoStudioContent() {
  const [prompt, setPrompt] = useState("")
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null)
  const [model, setModel] = useState<"sora-2" | "sora-2-pro">("sora-2")
  const [size, setSize] = useState<"1280x720" | "720x1280" | "1024x1792" | "1792x1024">("1280x720")
  const [seconds, setSeconds] = useState<"4" | "8" | "12">("8")
  const [generating, setGenerating] = useState(false)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [completedVideo, setCompletedVideo] = useState<VideoJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remixVideoId, setRemixVideoId] = useState<string | null>(null)
  const [remixPrompt, setRemixPrompt] = useState("")

  const videosParams = new URLSearchParams()
  videosParams.set("limit", "12")
  videosParams.set("order", "desc")
  const { data: videosData, mutate: mutateVideos } = useSWR<{ data: VideoJob[]; has_more: boolean }>(
    `/api/videos?${videosParams.toString()}`,
    fetcher
  )
  const recentVideos = videosData?.data ?? []

  const handleGenerate = useCallback(async () => {
    setError(null)
    setGenerating(true)
    setActiveVideoId(null)
    setCompletedVideo(null)

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt || "A serene landscape with gentle motion",
          model,
          size,
          seconds,
          referenceImageUrl: referenceImageUrl || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Generation failed")
      }
      const video = (await res.json()) as VideoJob
      setActiveVideoId(video.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
      setGenerating(false)
    }
  }, [prompt, model, size, seconds, referenceImageUrl])

  const handleVideoComplete = useCallback((job: VideoJob) => {
    setGenerating(false)
    setActiveVideoId(null)
    setCompletedVideo(job)
    mutateVideos()
    globalMutate("/api/videos")
  }, [mutateVideos])

  const handleRemixClick = useCallback((videoId: string) => {
    setRemixVideoId(videoId)
    setRemixPrompt("")
  }, [])

  const handleRemixSubmit = useCallback(async () => {
    if (!remixVideoId || !remixPrompt.trim()) return

    setError(null)
    setGenerating(true)
    setActiveVideoId(null)
    setCompletedVideo(null)

    try {
      const res = await fetch(`/api/videos/${remixVideoId}/remix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: remixPrompt }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Remix failed")
      }
      const video = (await res.json()) as VideoJob
      setActiveVideoId(video.id)
      setRemixVideoId(null)
      setRemixPrompt("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remix failed")
      setGenerating(false)
    }
  }, [remixVideoId, remixPrompt])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Video Studio</h1>
        <p className="text-sm text-muted-foreground">
          Create videos with OpenAI Sora. Use text prompts, reference images from your media, or remix existing videos.
        </p>
        <p className="text-xs text-muted-foreground/80 mt-0.5">
          Model: Sora 2 · Text-to-video, image-to-video, remix
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4" />
                {remixVideoId ? "Remix Video" : "Generate Video"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {remixVideoId ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>Remix prompt</Label>
                    <p className="text-xs text-muted-foreground">
                      Describe the change to apply to the original video. Keep it focused for best results.
                    </p>
                    <Textarea
                      value={remixPrompt}
                      onChange={(e) => setRemixPrompt(e.target.value)}
                      placeholder="e.g. Shift the color palette to teal and sand..."
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRemixVideoId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRemixSubmit}
                      disabled={generating || !remixPrompt.trim()}
                      className="gap-2"
                    >
                      {generating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Create Remix
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>Reference image (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Start from an image. The image will be resized to match the video size.
                    </p>
                    <BrandAssetReferencePicker
                      value={referenceImageUrl}
                      onChange={setReferenceImageUrl}
                      sourceBuckets={["product-images", "brand-assets", "ai-generations"]}
                      placeholder="Select image for image-to-video"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Prompt</Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the video you want to create..."
                      rows={4}
                      className="resize-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-2">
                      <Label>Model</Label>
                      <Select value={model} onValueChange={(v) => setModel(v as "sora-2" | "sora-2-pro")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sora-2">Sora 2 (faster)</SelectItem>
                          <SelectItem value="sora-2-pro">Sora 2 Pro (quality)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Size</Label>
                      <Select value={size} onValueChange={(v) => setSize(v as typeof size)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_SIZES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Duration</Label>
                      <Select value={seconds} onValueChange={(v) => setSeconds(v as "4" | "8" | "12")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_SECONDS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-fit gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>

                  <VideoGenerationProgress
                    videoId={activeVideoId}
                    active={generating}
                    message="Creating your video. This may take 1–3 minutes..."
                    onComplete={handleVideoComplete}
                  />

                  {completedVideo?.status === "completed" && (
                    <VideoPreview
                      videoId={completedVideo.id}
                      prompt={completedVideo.prompt ?? undefined}
                      onRemix={handleRemixClick}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Videos</CardTitle>
            </CardHeader>
            <CardContent>
              {recentVideos.length === 0 ? (
                <p className="text-xs text-muted-foreground">No videos yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentVideos.slice(0, 6).map((v) => (
                    <div
                      key={v.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {v.prompt?.slice(0, 40) ?? v.id}...
                        </span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px]">
                          {v.status}
                        </span>
                      </div>
                      {v.status === "completed" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px]"
                            asChild
                          >
                            <a href={`/api/videos/${v.id}/content?save=true`} download>
                              Download
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => handleRemixClick(v.id)}
                          >
                            Remix
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function VideoStudioPage() {
  return (
    <div className="flex min-h-[400px] flex-col">
      <VideoStudioContent />
    </div>
  )
}
