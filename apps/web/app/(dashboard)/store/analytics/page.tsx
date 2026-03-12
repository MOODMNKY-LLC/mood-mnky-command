"use client"

import useSWR from "swr"
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Receipt,
  DollarSign,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const FULFILLMENT_COLORS = ["hsl(var(--success))", "hsl(var(--info))", "hsl(var(--warning))"]
const FINANCIAL_COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"]

export default function StoreAnalyticsPage() {
  const { data, isLoading, error, mutate } = useSWR(
    "/api/shopify/analytics",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: reportsData } = useSWR("/api/shopify/analytics?type=reports", fetcher, {
    revalidateOnFocus: false,
  })

  const currency = data?.currency || "USD"
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Store performance and order insights (last 30 days)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            title: "Total Products",
            value: data?.totals?.totalProducts,
            icon: Package,
          },
          {
            title: "Total Customers",
            value: data?.totals?.totalCustomers,
            icon: Users,
          },
          {
            title: "30d Orders",
            value: data?.period?.orders30d,
            icon: Receipt,
          },
          {
            title: "30d Revenue",
            value: data?.period ? formatCurrency(data.period.revenue30d) : undefined,
            icon: DollarSign,
          },
        ].map((kpi) => (
          <Card key={kpi.title} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{kpi.title}</span>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <span className="text-2xl font-semibold text-foreground font-mono">
                      {kpi.value ?? "--"}
                    </span>
                  )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <kpi.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Avg Order Value */}
      {data?.period && (
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Average Order Value (30d)</span>
              <span className="text-xl font-mono font-semibold text-foreground">
                {formatCurrency(data.period.avgOrderValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground">Daily Revenue (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : data?.revenueTimeline?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.revenueTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(d: string) => {
                    const date = new Date(d)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  labelFormatter={(label: string) =>
                    new Date(label).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No revenue data for the last 30 days
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Fulfillment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : data?.fulfillmentBreakdown ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Fulfilled", value: data.fulfillmentBreakdown.fulfilled },
                        { name: "Partial", value: data.fulfillmentBreakdown.partial },
                        { name: "Unfulfilled", value: data.fulfillmentBreakdown.unfulfilled },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {FULFILLMENT_COLORS.map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Fulfilled", value: data.fulfillmentBreakdown.fulfilled, color: FULFILLMENT_COLORS[0] },
                    { label: "Partial", value: data.fulfillmentBreakdown.partial, color: FULFILLMENT_COLORS[1] },
                    { label: "Unfulfilled", value: data.fulfillmentBreakdown.unfulfilled, color: FULFILLMENT_COLORS[2] },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-mono font-medium text-foreground ml-auto">
                        {item.value}
                      </span>
                    </div>
                  ))}
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
              <DollarSign className="h-4 w-4 text-primary" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : data?.financialBreakdown ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Paid", value: data.financialBreakdown.paid },
                        { name: "Pending", value: data.financialBreakdown.pending },
                        { name: "Refunded", value: data.financialBreakdown.refunded },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {FINANCIAL_COLORS.map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Paid", value: data.financialBreakdown.paid, color: FINANCIAL_COLORS[0] },
                    { label: "Pending", value: data.financialBreakdown.pending, color: FINANCIAL_COLORS[1] },
                    { label: "Refunded", value: data.financialBreakdown.refunded, color: FINANCIAL_COLORS[2] },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-mono font-medium text-foreground ml-auto">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground">Top Products by Revenue (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : data?.topProducts?.length ? (
            <div className="flex flex-col gap-1">
              {data.topProducts.map(
                (
                  p: { title: string; count: number; revenue: number },
                  i: number
                ) => {
                  const maxRevenue = data.topProducts[0].revenue || 1
                  const pct = (p.revenue / maxRevenue) * 100

                  return (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <span className="text-xs text-muted-foreground font-mono w-5 text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground truncate">{p.title}</span>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-xs text-muted-foreground">
                              {p.count} sold
                            </span>
                            <span className="text-sm font-mono font-medium text-foreground">
                              {formatCurrency(p.revenue)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sales data available</p>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      {reportsData?.reports?.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground">Available Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {reportsData.reports.map(
                (report: { id: number; name: string; category: string; updated_at: string }) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-foreground">{report.name}</span>
                      <span className="text-xs text-muted-foreground">{report.category}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
