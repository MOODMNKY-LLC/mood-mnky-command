"use client"

import useSWR from "swr"
import {
  Megaphone,
  ExternalLink,
  Globe,
  DollarSign,
  Calendar,
  Target,
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

export default function StoreMarketingPage() {
  const { data, isLoading, error, mutate } = useSWR(
    "/api/shopify/marketing",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: countData } = useSWR("/api/shopify/marketing?count=true", fetcher, {
    revalidateOnFocus: false,
  })

  const events = data?.marketing_events || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Marketing
          </h1>
          <p className="text-sm text-muted-foreground">
            {countData?.count !== undefined
              ? `${countData.count} marketing events`
              : "Campaigns, attribution, and marketing events"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error || events.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Megaphone className="h-10 w-10" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">No marketing events</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Marketing events will appear here when you create campaigns in Shopify or connect external marketing tools.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>UTM</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(
                  (event: {
                    id: number
                    description: string
                    marketing_channel: string
                    event_type: string
                    paid: boolean
                    budget: string
                    currency: string
                    budget_type: string
                    utm_campaign: string | null
                    utm_source: string | null
                    utm_medium: string | null
                    started_at: string
                    ended_at: string | null
                    manage_url: string | null
                  }) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground line-clamp-1">
                            {event.description || `Event #${event.id}`}
                          </span>
                          {event.paid && (
                            <Badge className="text-[9px] w-fit border-0 bg-primary/10 text-primary">
                              Paid
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {event.marketing_channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {event.event_type}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-[10px] font-mono text-muted-foreground">
                          {event.utm_campaign && <span>campaign: {event.utm_campaign}</span>}
                          {event.utm_source && <span>source: {event.utm_source}</span>}
                          {event.utm_medium && <span>medium: {event.utm_medium}</span>}
                          {!event.utm_campaign && !event.utm_source && "--"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {parseFloat(event.budget) > 0 ? (
                          <span className="text-sm font-mono text-foreground">
                            ${event.budget} {event.currency}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          <span>{new Date(event.started_at).toLocaleDateString()}</span>
                          {event.ended_at && (
                            <span>to {new Date(event.ended_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {event.manage_url && (
                          <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                            <a
                              href={event.manage_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
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
