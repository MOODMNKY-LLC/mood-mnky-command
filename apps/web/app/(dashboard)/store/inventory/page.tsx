"use client"

import useSWR from "swr"
import {
  Warehouse,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function StoreInventoryPage() {
  const { data, isLoading, error, mutate } = useSWR(
    "/api/shopify/inventory",
    fetcher,
    { revalidateOnFocus: false }
  )

  const locations = data?.locations || []
  const products = data?.products || []
  const levels = data?.levels || []

  // Build a lookup: inventory_item_id -> available quantity
  const levelMap = new Map<number, number>()
  for (const level of levels) {
    const current = levelMap.get(level.inventory_item_id) || 0
    levelMap.set(level.inventory_item_id, current + (level.available ?? 0))
  }

  // Aggregate inventory per product
  const productInventory = products.map(
    (p: {
      id: number
      title: string
      status: string
      variants: Array<{
        id: number
        title: string
        sku: string
        inventory_item_id?: number
        inventory_quantity: number
      }>
    }) => {
      const variantData = p.variants.map((v) => ({
        ...v,
        tracked_quantity: v.inventory_item_id
          ? levelMap.get(v.inventory_item_id) ?? v.inventory_quantity
          : v.inventory_quantity,
      }))
      const totalStock = variantData.reduce((sum, v) => sum + v.tracked_quantity, 0)
      return { ...p, variantData, totalStock }
    }
  )

  const lowStockProducts = productInventory.filter(
    (p: { totalStock: number }) => p.totalStock > 0 && p.totalStock < 10
  )
  const outOfStockProducts = productInventory.filter(
    (p: { totalStock: number }) => p.totalStock <= 0
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            Stock levels, locations, and inventory tracking
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Locations</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {isLoading ? "--" : locations.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Tracked Products</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {isLoading ? "--" : products.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Low Stock</span>
              <span className="text-lg font-mono font-semibold text-warning">
                {isLoading ? "--" : lowStockProducts.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Out of Stock</span>
              <span className="text-lg font-mono font-semibold text-destructive">
                {isLoading ? "--" : outOfStockProducts.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations */}
      {locations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Fulfillment Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {locations.map(
                (loc: {
                  id: number
                  name: string
                  address1: string
                  city: string
                  province: string
                  country: string
                  active: boolean
                }) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{loc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[loc.city, loc.province, loc.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                    <Badge
                      className={`text-[10px] border-0 ${
                        loc.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {loc.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-primary" />
            Product Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : productInventory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Package className="h-8 w-8" />
              <p className="text-sm">No inventory data</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead className="text-right">Total Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productInventory.map(
                  (product: {
                    id: number
                    title: string
                    variantData: Array<{
                      id: number
                      title: string
                      sku: string
                      tracked_quantity: number
                    }>
                    totalStock: number
                  }) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {product.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.variantData.slice(0, 3).map((v) => (
                            <Badge
                              key={v.id}
                              variant="secondary"
                              className="text-[10px] font-mono"
                            >
                              {v.sku || v.title}: {v.tracked_quantity}
                            </Badge>
                          ))}
                          {product.variantData.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{product.variantData.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-mono font-medium ${
                            product.totalStock <= 0
                              ? "text-destructive"
                              : product.totalStock < 10
                                ? "text-warning"
                                : "text-foreground"
                          }`}
                        >
                          {product.totalStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        {product.totalStock <= 0 ? (
                          <Badge className="text-[10px] border-0 bg-destructive/10 text-destructive">
                            Out of stock
                          </Badge>
                        ) : product.totalStock < 10 ? (
                          <Badge className="text-[10px] border-0 bg-warning/10 text-warning">
                            Low stock
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] border-0 bg-success/10 text-success">
                            In stock
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
