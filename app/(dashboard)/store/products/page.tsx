"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Package,
  Search,
  ExternalLink,
  Eye,
  Loader2,
  Archive,
  FileEdit,
  CheckCircle2,
  ImageIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-success/10 text-success",
    draft: "bg-warning/10 text-warning",
    archived: "bg-muted text-muted-foreground",
  }
  return map[status] || "bg-muted text-muted-foreground"
}

export default function StoreProductsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const apiUrl =
    statusFilter === "all"
      ? "/api/shopify/products?limit=100"
      : `/api/shopify/products?limit=100&status=${statusFilter}`

  const { data, isLoading, error, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
  })
  const { data: countData } = useSWR("/api/shopify/products?count=true", fetcher, {
    revalidateOnFocus: false,
  })

  const products = data?.products || []
  const filtered = searchQuery
    ? products.filter(
        (p: Record<string, string>) =>
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.product_type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Products
          </h1>
          <p className="text-sm text-muted-foreground">
            {countData?.count !== undefined
              ? `${countData.count} products in your store`
              : "Manage your Shopify product catalog"}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="bg-transparent">
          <a
            href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || ""}/admin/products`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Shopify Admin <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      {/* Products Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-6 text-destructive text-sm">
              Failed to load products.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Package className="h-8 w-8" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Variants</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Inventory</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(
                  (product: {
                    id: number
                    title: string
                    status: string
                    vendor: string
                    product_type: string
                    variants: Array<{
                      price: string
                      inventory_quantity: number
                    }>
                    images: Array<{ src: string; alt: string | null }>
                    handle: string
                    updated_at: string
                  }) => {
                    const totalInventory = product.variants.reduce(
                      (sum, v) => sum + (v.inventory_quantity || 0),
                      0
                    )
                    const primaryPrice = product.variants[0]?.price || "0.00"
                    const hasImage = product.images?.[0]?.src

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {hasImage ? (
                            <img
                              src={product.images[0].src || "/placeholder.svg"}
                              alt={product.images[0].alt || product.title}
                              className="h-10 w-10 rounded-md object-cover border border-border"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary border border-border">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground">
                              {product.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {product.vendor}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] border-0 ${statusBadge(product.status)}`}
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {product.product_type || "--"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono text-foreground">
                            {product.variants.length}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono text-foreground">
                            ${primaryPrice}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-sm font-mono ${
                              totalInventory <= 0
                                ? "text-destructive"
                                : totalInventory < 10
                                  ? "text-warning"
                                  : "text-foreground"
                            }`}
                          >
                            {totalInventory}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-7 w-7 p-0"
                          >
                            <a
                              href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || ""}/admin/products/${product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Edit in Shopify"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
