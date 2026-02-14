"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const SHOPIFY_STORE_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "mood-mnky-3.myshopify.com"

export type ProductPickerInput = {
  products?: Array<{
    id?: string
    title?: string
    handle?: string
    imageUrl?: string | null
    productType?: string
  }>
  blendName?: string
  message?: string
  error?: string
}

interface ProductPickerCardProps {
  input: ProductPickerInput
  output?: ProductPickerInput
  className?: string
}

function getProductUrl(handle: string): string {
  const base = SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "")
  return `https://${base}/products/${handle}`
}

export function ProductPickerCard({
  input,
  output,
  className,
}: ProductPickerCardProps) {
  const products = (output?.products ?? input?.products ?? []) as Array<{
    id?: string
    title?: string
    handle?: string
    imageUrl?: string | null
    productType?: string
  }>
  const blendName = output?.blendName ?? input?.blendName
  const message = output?.message ?? input?.message
  const error = output?.error ?? input?.error

  if (products.length === 0 && !message && !error) return null

  return (
    <MagicCard
      className={cn(
        "rounded-lg border overflow-hidden",
        "gradientFrom-amber-500/20 gradientTo-rose-500/20",
        className
      )}
      gradientFrom="rgba(245, 158, 11, 0.3)"
      gradientTo="rgba(244, 63, 94, 0.3)"
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Product Picker</h4>
              <p className="text-xs text-muted-foreground">
                {blendName ? `Products for ${blendName}` : "Shop products for your blend"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {products.length === 0 && (message || error) && (
            <div className="space-y-2">
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : message ? (
                <p className="text-xs text-muted-foreground">{message}</p>
              ) : null}
              <a
                href={`https://${SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                Browse our store
              </a>
            </div>
          )}
          {products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((p) => (
                <a
                  key={p.id}
                  href={p.handle ? getProductUrl(p.handle) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border bg-card p-2 hover:bg-accent/50 transition-colors"
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title ?? "Product"}
                      className="aspect-square object-cover rounded-md w-full"
                    />
                  ) : (
                    <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                      <ShoppingBag className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="text-xs font-medium truncate flex-1">
                      {p.title ?? "Product"}
                    </span>
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  {p.productType && (
                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                      {p.productType}
                    </Badge>
                  )}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  )
}
