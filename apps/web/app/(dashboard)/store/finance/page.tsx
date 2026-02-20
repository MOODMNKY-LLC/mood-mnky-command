"use client"

import useSWR from "swr"
import {
  CreditCard,
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
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

function payoutStatusBadge(status: string) {
  const map: Record<string, string> = {
    paid: "bg-success/10 text-success",
    in_transit: "bg-info/10 text-info",
    scheduled: "bg-warning/10 text-warning",
    failed: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
  }
  return map[status] || "bg-muted text-muted-foreground"
}

export default function StoreFinancePage() {
  const { data, isLoading, error, mutate } = useSWR(
    "/api/shopify/finance",
    fetcher,
    { revalidateOnFocus: false }
  )

  const balances = data?.balance || []
  const payouts = data?.payouts || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Finance
          </h1>
          <p className="text-sm text-muted-foreground">
            Shopify Payments balance and payouts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : error || (data?.error && !balances.length) ? (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-6">
            <p className="text-sm text-foreground">
              Shopify Payments data may not be available for your store plan. This requires the{" "}
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">
                read_shopify_payments_payouts
              </code>{" "}
              access scope.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {balances.map(
            (bal: { currency: string; amount: string }, i: number) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Balance ({bal.currency})
                    </span>
                    <span className="text-2xl font-mono font-semibold text-foreground">
                      ${parseFloat(bal.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          )}
          {balances.length === 0 && (
            <Card className="bg-card border-border col-span-full">
              <CardContent className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Wallet className="h-5 w-5" />
                <span className="text-sm">No balance data available</span>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Payouts Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-primary" />
            Recent Payouts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <CreditCard className="h-8 w-8" />
              <p className="text-sm">No payouts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map(
                  (payout: {
                    id: number
                    date: string
                    status: string
                    amount: string
                    currency: string
                  }) => (
                    <TableRow key={payout.id}>
                      <TableCell className="text-sm font-mono text-foreground">
                        #{payout.id}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(payout.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] border-0 ${payoutStatusBadge(payout.status)}`}
                        >
                          {payout.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-mono font-medium text-foreground">
                          ${parseFloat(payout.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          <span className="text-xs text-muted-foreground">{payout.currency}</span>
                        </span>
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
