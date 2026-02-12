"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { ChevronDown, ImageIcon, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MediaAsset } from "@/lib/supabase/storage"
import type { BucketId } from "@/lib/supabase/storage"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface BrandAssetReferencePickerProps {
  /** Current reference URL (from brand asset or product import) */
  value: string | null
  onChange: (url: string | null, source?: "brand" | "product") => void
  /** Assets to choose from (used when sourceBuckets not provided) */
  assets?: MediaAsset[]
  /** When provided, fetch from these buckets and merge. Overrides assets. */
  sourceBuckets?: BucketId[]
  /** Optional: product image loaded from Shopify import */
  productImageUrl?: string | null
  placeholder?: string
  disabled?: boolean
}

export function BrandAssetReferencePicker({
  value,
  onChange,
  assets: assetsProp,
  sourceBuckets,
  productImageUrl,
  placeholder = "Select reference image",
  disabled = false,
}: BrandAssetReferencePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const buckets = sourceBuckets ?? ["brand-assets"]
  const multiSourceUrl = sourceBuckets
    ? `/api/media?buckets=${buckets.join(",")}&limit=100`
    : null
  const { data: multiSourceData } = useSWR<{ assets: MediaAsset[] }>(
    multiSourceUrl,
    fetcher
  )

  const assets = sourceBuckets
    ? (multiSourceData?.assets ?? [])
    : (assetsProp ?? [])

  const imageAssets = useMemo(
    () =>
      assets.filter(
        (a) =>
          (a.public_url ?? a.thumbnail_url) && a.mime_type?.startsWith("image/")
      ),
    [assets]
  )

  const filteredAssets = useMemo(() => {
    if (!search.trim()) return imageAssets
    const q = search.toLowerCase()
    return imageAssets.filter(
      (a) =>
        a.file_name?.toLowerCase().includes(q) ||
        a.alt_text?.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }, [imageAssets, search])

  const selectedFromProduct = !!productImageUrl && value === productImageUrl
  const selectedAsset = imageAssets.find((a) => a.public_url === value)

  const displayUrl = value ?? undefined
  const displayLabel = selectedFromProduct
    ? "Product from Shopify"
    : selectedAsset?.file_name ?? selectedAsset?.alt_text ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-auto min-h-[72px] w-full justify-start gap-3 px-3 py-2 text-left",
            !displayUrl && "text-muted-foreground"
          )}
        >
          {displayUrl ? (
            <>
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                <img
                  src={displayUrl}
                  alt={displayLabel || "Reference"}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget
                    img.style.display = "none"
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 truncate text-sm">
                {displayLabel}
                {selectedFromProduct && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Imported product image
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/30">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm">{placeholder}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={sourceBuckets ? "Search assets..." : "Search brand assets..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-[280px]">
          <div className="p-2">
            {/* Product from import (when available) */}
            {productImageUrl && (
              <button
                type="button"
                onClick={() => {
                  onChange(productImageUrl, "product")
                  setOpen(false)
                }}
                className={cn(
                  "mb-2 flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-accent",
                  selectedFromProduct && "border-primary bg-primary/5 ring-1 ring-primary/20"
                )}
              >
                <img
                  src={productImageUrl}
                  alt="Product"
                  className="h-12 w-12 rounded object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">Product from Shopify</p>
                  <p className="text-xs text-muted-foreground">Imported product image</p>
                </div>
              </button>
            )}

            {/* Brand assets */}
            <div className="grid grid-cols-4 gap-2">
              {filteredAssets.map((asset) => {
                const url = asset.public_url ?? asset.thumbnail_url
                if (!url) return null
                const isSelected = value === asset.public_url
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onChange(asset.public_url ?? null, "brand")
                      setOpen(false)
                    }}
                    className={cn(
                      "group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors hover:bg-accent",
                      isSelected && "border-primary bg-primary/5 ring-1 ring-primary/20"
                    )}
                    title={asset.alt_text || asset.file_name}
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded border border-border">
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
                    </div>
                    <span className="max-w-full truncate text-[10px] text-muted-foreground">
                      {asset.file_name?.replace(/\.[^.]+$/, "") || "Asset"}
                    </span>
                  </button>
                )
              })}
            </div>

            {filteredAssets.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {search
                  ? "No matching assets"
                  : sourceBuckets
                    ? "No images in selected sources. Upload to brand-assets, product-images, or ai-generations."
                    : "No brand assets yet. Upload to brand-assets bucket."}
              </p>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5 text-muted-foreground"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear reference
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
