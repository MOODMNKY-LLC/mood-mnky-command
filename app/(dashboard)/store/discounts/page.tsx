"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Tag,
  Gift,
  Percent,
  DollarSign,
  ExternalLink,
  Calendar,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export default function StoreDiscountsPage() {
  const [tab, setTab] = useState("discounts")

  const { data: discountsData, isLoading: discountsLoading, mutate } = useSWR(
    "/api/shopify/discounts",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: giftCardsData, isLoading: giftCardsLoading } = useSWR(
    "/api/shopify/discounts?type=gift_cards",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: discountCount } = useSWR("/api/shopify/discounts?count=true", fetcher, {
    revalidateOnFocus: false,
  })
  const { data: giftCardCount } = useSWR(
    "/api/shopify/discounts?type=gift_cards&count=true",
    fetcher,
    { revalidateOnFocus: false }
  )

  const priceRules = discountsData?.price_rules || []
  const giftCards = giftCardsData?.gift_cards || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Discounts & Gift Cards
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage discount codes, price rules, and gift cards
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <Tag className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Discount Rules</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {discountCount?.count ?? "--"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <Gift className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Gift Cards</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {giftCardCount?.count ?? "--"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="discounts">Discount Codes</TabsTrigger>
          <TabsTrigger value="gift_cards">Gift Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="discounts" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {discountsLoading ? (
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : priceRules.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Tag className="h-8 w-8" />
                  <p className="text-sm">No discount rules found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Codes</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceRules.map(
                      (rule: {
                        id: number
                        title: string
                        value_type: string
                        value: string
                        target_type: string
                        target_selection: string
                        usage_limit: number | null
                        once_per_customer: boolean
                        starts_at: string
                        ends_at: string | null
                        discount_codes?: Array<{
                          code: string
                          usage_count: number
                        }>
                      }) => {
                        const isPercentage = rule.value_type === "percentage"
                        const absValue = Math.abs(parseFloat(rule.value))

                        return (
                          <TableRow key={rule.id}>
                            <TableCell>
                              <span className="text-sm font-medium text-foreground">
                                {rule.title}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.discount_codes?.slice(0, 3).map((code) => (
                                  <Badge
                                    key={code.code}
                                    variant="secondary"
                                    className="text-[10px] font-mono"
                                  >
                                    {code.code} ({code.usage_count})
                                  </Badge>
                                ))}
                                {(rule.discount_codes?.length || 0) > 3 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    +{(rule.discount_codes?.length || 0) - 3} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="text-[10px] border-0 bg-secondary text-secondary-foreground">
                                {isPercentage ? (
                                  <Percent className="h-2.5 w-2.5 mr-0.5" />
                                ) : (
                                  <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                                )}
                                {rule.value_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono text-foreground">
                                {isPercentage ? `${absValue}%` : `$${absValue}`}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {rule.target_type} / {rule.target_selection}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {rule.usage_limit ? `Limit: ${rule.usage_limit}` : "Unlimited"}
                                {rule.once_per_customer ? " (1/customer)" : ""}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                <span>From: {new Date(rule.starts_at).toLocaleDateString()}</span>
                                {rule.ends_at && (
                                  <span>To: {new Date(rule.ends_at).toLocaleDateString()}</span>
                                )}
                              </div>
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
        </TabsContent>

        <TabsContent value="gift_cards" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {giftCardsLoading ? (
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : giftCards.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Gift className="h-8 w-8" />
                  <p className="text-sm">No gift cards found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Card</TableHead>
                      <TableHead>Initial Value</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCards.map(
                      (card: {
                        id: number
                        last_characters: string
                        initial_value: string
                        balance: string
                        currency: string
                        disabled_at: string | null
                        expires_on: string | null
                        created_at: string
                      }) => (
                        <TableRow key={card.id}>
                          <TableCell>
                            <span className="text-sm font-mono text-foreground">
                              ****{card.last_characters}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono text-foreground">
                              ${card.initial_value}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-sm font-mono font-medium ${
                                parseFloat(card.balance) > 0
                                  ? "text-success"
                                  : "text-muted-foreground"
                              }`}
                            >
                              ${card.balance}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] border-0 ${
                                card.disabled_at
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-success/10 text-success"
                              }`}
                            >
                              {card.disabled_at ? "Disabled" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(card.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {card.expires_on
                              ? new Date(card.expires_on).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
