"use client"

import React from "react"

import useSWR from "swr"
import {
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  Shield,
  Loader2,
  AlertCircle,
  FolderOpen,
  Tag,
  Receipt,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  loading,
}: {
  title: string
  value: string | number | undefined
  icon: React.ElementType
  href: string
  loading: boolean
}) {
  return (
    <Link href={href}>
      <Card className="bg-card border-border hover:border-primary/30 transition-colors group cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{title}</span>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <span className="text-2xl font-semibold text-foreground font-mono">
                  {value ?? "--"}
                </span>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function StorePage() {
  const { data: shop, isLoading: shopLoading, error: shopError } = useSWR(
    "/api/shopify/shop",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: analytics, isLoading: analyticsLoading } = useSWR(
    "/api/shopify/analytics",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: scopes } = useSWR("/api/shopify/scopes", fetcher, {
    revalidateOnFocus: false,
  })

  const isConnected = shop?.shop && !shopError
  const currency = analytics?.currency || "USD"

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)

  if (shopError || (!shopLoading && !isConnected)) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Shopify Store
        </h1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">Store not connected</p>
              <p className="text-xs text-muted-foreground">
                Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN in the Vars sidebar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Shopify Store
          </h1>
          {shopLoading ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {shop?.shop?.name} &middot; {shop?.shop?.myshopify_domain}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[10px] border-0 bg-success/10 text-success">Connected</Badge>
          {shop?.shop?.myshopify_domain && (
            <Button variant="outline" size="sm" asChild className="bg-transparent">
              <a
                href={`https://${shop.shop.myshopify_domain}/admin`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Admin <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={analytics?.totals?.totalProducts}
          icon={Package}
          href="/store/products"
          loading={analyticsLoading}
        />
        <StatCard
          title="Total Orders"
          value={analytics?.totals?.totalOrders}
          icon={Receipt}
          href="/store/orders"
          loading={analyticsLoading}
        />
        <StatCard
          title="Customers"
          value={analytics?.totals?.totalCustomers}
          icon={Users}
          href="/store/customers"
          loading={analyticsLoading}
        />
        <StatCard
          title="30-Day Revenue"
          value={analytics?.period ? formatCurrency(analytics.period.revenue30d) : undefined}
          icon={TrendingUp}
          href="/store/analytics"
          loading={analyticsLoading}
        />
      </div>

      {/* 30-Day Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              30-Day Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : analytics?.period ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-xs text-muted-foreground">Orders</span>
                  <span className="text-sm font-mono font-medium text-foreground">
                    {analytics.period.orders30d}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-xs text-muted-foreground">Revenue</span>
                  <span className="text-sm font-mono font-medium text-foreground">
                    {formatCurrency(analytics.period.revenue30d)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-xs text-muted-foreground">Avg Order Value</span>
                  <span className="text-sm font-mono font-medium text-foreground">
                    {formatCurrency(analytics.period.avgOrderValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Fulfillment Rate</span>
                  <span className="text-sm font-mono font-medium text-foreground">
                    {analytics.fulfillmentBreakdown
                      ? `${Math.round(
                          (analytics.fulfillmentBreakdown.fulfilled /
                            Math.max(analytics.period.orders30d, 1)) *
                            100
                        )}%`
                      : "--"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Top Products (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : analytics?.topProducts?.length ? (
              <div className="flex flex-col gap-2">
                {analytics.topProducts.slice(0, 5).map(
                  (
                    p: { title: string; count: number; revenue: number },
                    i: number
                  ) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground font-mono w-4">
                          {i + 1}
                        </span>
                        <span className="text-sm text-foreground truncate">
                          {p.title}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sales in the last 30 days</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { title: "Products", href: "/store/products", icon: Package },
          { title: "Collections", href: "/store/collections", icon: FolderOpen },
          { title: "Orders", href: "/store/orders", icon: Receipt },
          { title: "Customers", href: "/store/customers", icon: Users },
          { title: "Discounts", href: "/store/discounts", icon: Tag },
          { title: "Content", href: "/store/content", icon: ShoppingBag },
          { title: "Finance", href: "/store/finance", icon: CreditCard },
          { title: "Analytics", href: "/store/analytics", icon: BarChart3 },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="bg-card border-border hover:border-primary/30 transition-colors group cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-foreground">{link.title}</span>
                <ArrowUpRight className="ml-auto h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Access Scopes */}
      {scopes?.scopes && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              API Access Scopes ({scopes.scopes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {scopes.scopes.map((scope: string) => (
                <Badge key={scope} variant="secondary" className="text-[10px] font-mono">
                  {scope}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
