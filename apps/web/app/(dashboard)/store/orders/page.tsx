"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Receipt,
  Search,
  ExternalLink,
  Loader2,
  FileText,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function financialBadge(status: string) {
  const map: Record<string, string> = {
    paid: "bg-success/10 text-success",
    partially_paid: "bg-warning/10 text-warning",
    pending: "bg-warning/10 text-warning",
    authorized: "bg-info/10 text-info",
    refunded: "bg-muted text-muted-foreground",
    partially_refunded: "bg-warning/10 text-warning",
    voided: "bg-destructive/10 text-destructive",
  }
  return map[status] || "bg-muted text-muted-foreground"
}

function fulfillmentBadge(status: string | null) {
  if (!status || status === "unfulfilled")
    return "bg-warning/10 text-warning"
  if (status === "fulfilled") return "bg-success/10 text-success"
  if (status === "partial") return "bg-info/10 text-info"
  return "bg-muted text-muted-foreground"
}

export default function StoreOrdersPage() {
  const [tab, setTab] = useState("orders")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: ordersData, isLoading: ordersLoading, mutate: mutateOrders } = useSWR(
    "/api/shopify/orders?limit=100&status=any",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: draftsData, isLoading: draftsLoading } = useSWR(
    "/api/shopify/orders?type=draft&limit=50",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: abandonedData, isLoading: abandonedLoading } = useSWR(
    "/api/shopify/orders?type=abandoned&limit=50",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: orderCountData } = useSWR("/api/shopify/orders?count=true&status=any", fetcher, {
    revalidateOnFocus: false,
  })
  const { data: draftCountData } = useSWR("/api/shopify/orders?type=draft&count=true", fetcher, {
    revalidateOnFocus: false,
  })
  const { data: abandonedCountData } = useSWR(
    "/api/shopify/orders?type=abandoned&count=true",
    fetcher,
    { revalidateOnFocus: false }
  )

  const orders = ordersData?.orders || []
  const drafts = draftsData?.draft_orders || []
  const abandoned = abandonedData?.checkouts || []

  const filteredOrders = searchQuery
    ? orders.filter(
        (o: { name: string; email: string }) =>
          o.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage orders, drafts, and abandoned checkouts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutateOrders()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <Receipt className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Orders</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {orderCountData?.count ?? "--"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Drafts</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {draftCountData?.count ?? "--"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingCart className="h-5 w-5 text-warning" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Abandoned</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {abandonedCountData?.count ?? "--"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="drafts">Draft Orders</TabsTrigger>
          <TabsTrigger value="abandoned">Abandoned Checkouts</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {ordersLoading ? (
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Receipt className="h-8 w-8" />
                  <p className="text-sm">No orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Fulfillment</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map(
                      (order: {
                        id: number
                        name: string
                        email: string
                        created_at: string
                        financial_status: string
                        fulfillment_status: string | null
                        total_price: string
                        currency: string
                        line_items: Array<{ quantity: number }>
                        cancelled_at: string | null
                      }) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground font-mono">
                                {order.name}
                              </span>
                              {order.cancelled_at && (
                                <span className="text-[10px] text-destructive">Cancelled</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-foreground truncate max-w-[160px] block">
                              {order.email || "--"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] border-0 ${financialBadge(order.financial_status)}`}
                            >
                              {order.financial_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] border-0 ${fulfillmentBadge(order.fulfillment_status)}`}
                            >
                              {order.fulfillment_status || "unfulfilled"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono text-foreground">
                              {order.line_items?.reduce((s, i) => s + i.quantity, 0) || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-mono font-medium text-foreground">
                              ${order.total_price}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                              <a
                                href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || ""}/admin/orders/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {draftsLoading ? (
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : drafts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <p className="text-sm">No draft orders</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Draft</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drafts.map(
                      (draft: {
                        id: number
                        name: string
                        email: string
                        created_at: string
                        status: string
                        total_price: string
                      }) => (
                        <TableRow key={draft.id}>
                          <TableCell className="font-mono text-sm">{draft.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(draft.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">{draft.email || "--"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {draft.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            ${draft.total_price}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abandoned" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {abandonedLoading ? (
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : abandoned.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8" />
                  <p className="text-sm">No abandoned checkouts</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Checkout</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Recovery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {abandoned.map(
                      (checkout: {
                        id: number
                        email: string
                        created_at: string
                        total_price: string
                        abandoned_checkout_url: string
                        completed_at: string | null
                        line_items: Array<{ quantity: number }>
                      }) => (
                        <TableRow key={checkout.id}>
                          <TableCell className="font-mono text-xs">
                            #{String(checkout.id).slice(-6)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(checkout.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">{checkout.email || "--"}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {checkout.line_items?.reduce((s, i) => s + i.quantity, 0) || 0}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            ${checkout.total_price}
                          </TableCell>
                          <TableCell className="text-right">
                            {checkout.completed_at ? (
                              <Badge className="text-[10px] border-0 bg-success/10 text-success">
                                Recovered
                              </Badge>
                            ) : (
                              <a
                                href={checkout.abandoned_checkout_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Recovery link
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
