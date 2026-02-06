"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, ShoppingBag, Loader2, AlertCircle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ShopifyStatus() {
  const { data: shopData, error: shopError, isLoading: shopLoading } = useSWR(
    "/api/shopify/shop",
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 1 }
  )
  const { data: productData } = useSWR(
    "/api/shopify/products?count=true",
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 1 }
  )

  const isConnected = shopData?.shop && !shopError
  const shopName = shopData?.shop?.name
  const shopDomain = shopData?.shop?.myshopify_domain
  const productCount = productData?.count

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Shopify Store
          </CardTitle>
          <Badge
            className={`text-[10px] border-0 ${
              shopLoading
                ? "bg-muted text-muted-foreground"
                : isConnected
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
            }`}
          >
            {shopLoading ? "Connecting..." : isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {shopLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting to Shopify...
          </div>
        ) : isConnected ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{shopName}</span>
                <span className="text-xs text-muted-foreground">{shopDomain}</span>
              </div>
              <a
                href={`https://${shopDomain}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Admin <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {productCount !== undefined && (
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">Products</span>
                <span className="text-sm font-mono font-semibold text-foreground">
                  {productCount}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span>
              Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN in the Vars sidebar.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
