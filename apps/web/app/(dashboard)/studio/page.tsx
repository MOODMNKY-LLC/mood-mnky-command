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
import { BrandAssetReferencePicker } from "@/components/studio/brand-asset-reference-picker"
import { ImageGenerationProgress } from "@/components/studio/image-generation-progress"
import type { MediaAsset } from "@/lib/supabase/storage"
import type { FragranceOil } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const FRAGRANCE_NAMES = Object.keys(FRAGRANCE_SCENE_PROMPTS)

function StudioContent() {
  const searchParams = useSearchParams()
  const [selectedFragrance, setSelectedFragrance] = useState<string>("")
  const [prompt, setPrompt] = useState("")
  const [referenceUrl1, setReferenceUrl1] = useState<string | null>(null)
  const [referenceUrl2, setReferenceUrl2] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [partialImageDataUrl, setPartialImageDataUrl] = useState<string | null>(null)
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

  const shopifyProductId = searchParams.get("shopifyProductId")
  const shopifyImageId = searchParams.get("shopifyImageId")
  const refUrl = searchParams.get("refUrl")
  const refAssetId = searchParams.get("refAssetId")
  const ref1Url = searchParams.get("ref1Url")
  const ref1AssetId = searchParams.get("ref1AssetId")
  const ref2Url = searchParams.get("ref2Url")
  const ref2AssetId = searchParams.get("ref2AssetId")

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

  useEffect(() => {
    const url1 = ref1Url ?? refUrl
    const assetId1 = ref1AssetId ?? refAssetId
    if (url1) {
      setReferenceUrl1(url1)
    } else if (assetId1) {
      fetch(`/api/media/${assetId1}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.asset?.public_url) setReferenceUrl1(data.asset.public_url)
        })
        .catch(() => {})
    }
  }, [ref1Url, ref1AssetId, refUrl, refAssetId])

  useEffect(() => {
    if (ref2Url) {
      setReferenceUrl2(ref2Url)
    } else if (ref2AssetId) {
      fetch(`/api/media/${ref2AssetId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.asset?.public_url) setReferenceUrl2(data.asset.public_url)
        })
        .catch(() => {})
    }
  }, [ref2Url, ref2AssetId])

  useEffect(() => {
    if (shopifyProductId && shopifyImageId && (refUrl || refAssetId || ref1Url || ref1AssetId) && !prompt) {
      setPrompt(
        "Image 1: product photo. Maintain the product exactly, improve lighting and background. Keep the subject crisp with professional product photography style."
      )
    }
  }, [shopifyProductId, shopifyImageId, refUrl, refAssetId, ref1Url, ref1AssetId])

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
    setPartialImageDataUrl(null)
    const referenceUrls = [referenceUrl1, referenceUrl2].filter(
      (u): u is string => !!u
    )
    try {
      const res = await fetch("/api/images/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt || "The MOOD MNKY mascot in an elegant fragrance scene, warm lighting",
          referenceImageUrls: referenceUrls.length ? referenceUrls : undefined,
          referenceImageUrl: referenceUrls.length === 1 ? referenceUrls[0] : undefined,
          fragranceId: fragranceOils.find((o) => o.name === selectedFragrance)?.id,
          fragranceName: selectedFragrance || undefined,
          shopifyProductId: shopifyProductId ? parseInt(shopifyProductId, 10) : undefined,
          shopifyImageId: shopifyImageId ? parseInt(shopifyImageId, 10) : undefined,
          model: "gpt-image-1.5",
          size: "1024x1024",
          quality: "high",
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Generation failed")
      }
      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")
      const decoder = new TextDecoder()
      let buffer = ""
      let currentEvent = ""
      let currentData = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim()
          } else if (line.startsWith("data:")) {
            currentData = line.slice(5).trim()
          } else if (line === "" && currentEvent && currentData) {
            try {
              const payload = JSON.parse(currentData) as Record<string, unknown>
              if (currentEvent === "partial_image" && typeof payload.b64_json === "string") {
                setPartialImageDataUrl(`data:image/png;base64,${payload.b64_json}`)
              } else if (currentEvent === "asset_ready" && payload.asset) {
                setGeneratedAsset(payload.asset as MediaAsset)
                setPartialImageDataUrl(null)
                mutateMedia()
                globalMutate("/api/media")
              } else if (currentEvent === "error" && payload.error) {
                throw new Error(String(payload.error))
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                // Invalid JSON in data - skip
              } else {
                throw e
              }
            }
            currentEvent = ""
            currentData = ""
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      setGenerating(false)
      setPartialImageDataUrl(null)
    }
  }, [prompt, referenceUrl1, referenceUrl2, selectedFragrance, fragranceOils, shopifyProductId, shopifyImageId, mutateMedia])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Image Studio</h1>
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
                <Label>Image to edit (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Product photo or asset to edit. Use &quot;Product from Shopify&quot; when imported from Store.
                </p>
                <BrandAssetReferencePicker
                  value={referenceUrl1}
                  onChange={setReferenceUrl1}
                  sourceBuckets={["product-images", "brand-assets", "ai-generations"]}
                  productImageUrl={refUrl ?? null}
                  placeholder="Select product or asset to edit"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Style reference (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Mascot, character, or brand asset to guide style. Use with the prompt to describe how images interact.
                </p>
                <BrandAssetReferencePicker
                  value={referenceUrl2}
                  onChange={setReferenceUrl2}
                  sourceBuckets={["product-images", "brand-assets", "ai-generations"]}
                  placeholder="Select style reference"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Prompt</Label>
                <p className="text-xs text-muted-foreground">
                  For multiple references, describe each: e.g. &quot;Image 1: product photo. Image 2: style reference. Apply Image 2&apos;s style to Image 1.&quot;
                </p>
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

              <ImageGenerationProgress
                active={generating}
                message="Creating your image. This usually takes 10–30 seconds..."
                showSkeleton={true}
                partialImageDataUrl={partialImageDataUrl}
              />

              {generatedAsset?.public_url && (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Generated</p>
                  <div className="flex items-center gap-2">
                    <img
                      src={generatedAsset.public_url ?? generatedAsset.medium_url}
                      alt="Generated"
                      className="h-24 w-24 rounded-lg object-cover"
                      onError={(e) => {
                        const img = e.currentTarget
                        if (generatedAsset.public_url && img.src !== generatedAsset.public_url) {
                          img.src = generatedAsset.public_url
                        }
                      }}
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
                      {(asset.public_url ?? asset.thumbnail_url) && asset.mime_type?.startsWith("image/") ? (
                        <img
                          src={asset.public_url ?? asset.thumbnail_url!}
                          alt={asset.alt_text || asset.file_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget
                            if (asset.public_url && img.src !== asset.public_url) {
                              img.src = asset.public_url
                            }
                          }}
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
