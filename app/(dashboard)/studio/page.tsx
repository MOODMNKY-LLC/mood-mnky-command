"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import useSWR, { mutate as globalMutate } from "swr"
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  ImageIcon,
  RefreshCw,
  ChevronDown,
} from "lucide-react"
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
import { FRAGRANCE_SCENE_PROMPTS, getPromptForFragrance } from "@/lib/prompts/fragrance-scenes"
import { IMAGE_WORKFLOWS } from "@/lib/image-workflows"
import type { MediaAsset } from "@/lib/supabase/storage"
import { BUCKET_CONFIG, type BucketId } from "@/lib/supabase/storage"
import type { FragranceOil } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const FRAGRANCE_NAMES = Object.keys(FRAGRANCE_SCENE_PROMPTS)

function StudioContent() {
  const searchParams = useSearchParams()
  const [selectedFragrance, setSelectedFragrance] = useState<string>("")
  const [prompt, setPrompt] = useState("")
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedAsset, setGeneratedAsset] = useState<MediaAsset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const { data: fragranceData } = useSWR<{ fragranceOils: FragranceOil[]; total: number }>(
    "/api/fragrance-oils",
    fetcher
  )
  const fragranceOils = fragranceData?.fragranceOils ?? []

  const mediaParams = new URLSearchParams()
  mediaParams.set("bucket", "ai-generations")
  mediaParams.set("limit", "12")
  const { data: mediaData, mutate: mutateMedia } = useSWR<{ assets: MediaAsset[]; count: number }>(
    `/api/media?${mediaParams.toString()}`,
    fetcher
  )
  const recentAssets = mediaData?.assets ?? []

  const refParams = new URLSearchParams()
  refParams.set("bucket", "brand-assets")
  refParams.set("limit", "20")
  const { data: refData } = useSWR<{ assets: MediaAsset[] }>(
    `/api/media?${refParams.toString()}`,
    fetcher
  )
  const referenceAssets = refData?.assets ?? []

  useEffect(() => {
    const fragranceId = searchParams.get("fragranceId")
    const fragranceName = searchParams.get("fragranceName")
    if (fragranceId || fragranceName) {
      const oil = fragranceOils.find(
        (o) => o.id === fragranceId || o.name === (fragranceName ?? "")
      )
      const name = oil?.name ?? fragranceName ?? ""
      if (name) {
        setSelectedFragrance(name)
        setPrompt(getPromptForFragrance(name))
      }
    }
  }, [searchParams, fragranceOils])

  const handleFragranceChange = useCallback(
    (value: string) => {
      setSelectedFragrance(value)
      const oil = fragranceOils.find((o) => o.name === value) ?? fragranceOils.find((o) => o.id === value)
      const name = oil?.name ?? value
      setPrompt(getPromptForFragrance(name))
    },
    [fragranceOils]
  )

  const handleGenerate = useCallback(async () => {
    setError(null)
    setGenerating(true)
    setGeneratedAsset(null)
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt || "The MOOD MNKY mascot in an elegant fragrance scene, warm lighting",
          referenceImageUrl: referenceUrl || undefined,
          fragranceId: fragranceOils.find((o) => o.name === selectedFragrance)?.id,
          fragranceName: selectedFragrance || undefined,
          model: "gpt-image-1.5",
          size: "1024x1024",
          quality: "high",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      setGeneratedAsset(data.asset)
      mutateMedia()
      globalMutate("/api/media")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      setGenerating(false)
    }
  }, [prompt, referenceUrl, selectedFragrance, fragranceOils, mutateMedia])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Studio</h1>
        <p className="text-sm text-muted-foreground">
          {IMAGE_WORKFLOWS.STUDIO_FRAGRANCE_SCENE.description}
        </p>
        <p className="text-xs text-muted-foreground/80 mt-0.5">
          Workflow: {IMAGE_WORKFLOWS.STUDIO_FRAGRANCE_SCENE.name} · Model: {IMAGE_WORKFLOWS.STUDIO_FRAGRANCE_SCENE.model}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main: Generate form */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" />
                Generate Scene
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Fragrance</Label>
                <Select value={selectedFragrance} onValueChange={handleFragranceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a fragrance blend" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAGRANCE_NAMES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                    {fragranceOils
                      .filter((o) => !FRAGRANCE_NAMES.includes(o.name))
                      .map((o) => (
                        <SelectItem key={o.id} value={o.name}>
                          {o.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Reference Image (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Use a mascot or reference asset for consistent character placement
                </p>
                <div className="flex flex-wrap gap-2">
                  {referenceAssets
                    .filter((a) => a.public_url && a.mime_type?.startsWith("image/"))
                    .slice(0, 6)
                    .map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() =>
                          setReferenceUrl((prev) =>
                            prev === asset.public_url ? null : asset.public_url ?? null
                          )
                        }
                        className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                          referenceUrl === asset.public_url
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <img
                          src={asset.public_url!}
                          alt={asset.alt_text || asset.file_name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  {referenceAssets.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Upload mascot to brand-assets with tag &quot;mascot&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the scene..."
                  rows={4}
                  className="resize-none text-sm"
                />
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

              {generatedAsset?.public_url && (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Generated</p>
                  <div className="flex items-center gap-2">
                    <img
                      src={generatedAsset.public_url}
                      alt="Generated"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit gap-1"
                        onClick={() => handleCopyUrl(generatedAsset.public_url!)}
                      >
                        {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedUrl ? "Copied" : "Copy URL"}
                      </Button>
                      <a
                        href={generatedAsset.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Recent generations */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Generations</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAssets.length === 0 ? (
                <p className="text-xs text-muted-foreground">No generations yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {recentAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                    >
                      {asset.public_url && asset.mime_type?.startsWith("image/") ? (
                        <img
                          src={asset.public_url}
                          alt={asset.alt_text || asset.file_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] text-white hover:bg-white/20"
                          onClick={() =>
                            asset.public_url && handleCopyUrl(asset.public_url)
                          }
                        >
                          Copy URL
                        </Button>
                      </div>
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

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[400px] items-center justify-center p-6">Loading...</div>}>
      <StudioContent />
    </Suspense>
  )
}
