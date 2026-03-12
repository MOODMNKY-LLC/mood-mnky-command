"use client"

import useSWR from "swr"
import { Server, ExternalLink, Palette } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ServiceAnalyticsItem = {
  serviceId: string
  name: string
  configured: boolean
  status?: string
  metrics?: Record<string, number | string>
  error?: string
}

type ServiceArtifactUrls = { themeUrl?: string; dockerUrl?: string }

export default function PlatformServicesPage() {
  const { data: services, isLoading, error, mutate } = useSWR<ServiceAnalyticsItem[]>(
    "/api/labz/services/analytics",
    fetcher,
    { revalidateOnFocus: false },
  )
  const { data: artifacts } = useSWR<Record<string, ServiceArtifactUrls>>(
    "/api/labz/services/artifacts",
    fetcher,
    { revalidateOnFocus: false },
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Service Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Status and metrics for deployed services (MNKY CLOUD, MEDIA, DRIVE, AUTO, AGENTS). Configure credentials in .env to see live data.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Failed to load service analytics.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(services ?? []).map((item) => (
            <Card key={item.serviceId} className="flex flex-col">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-4 w-4 text-primary" />
                  </div>
                  {item.name}
                </CardTitle>
                <Badge
                  variant={item.configured ? "default" : "secondary"}
                  className={item.configured ? "bg-success/10 text-success border-0" : ""}
                >
                  {item.configured ? "Configured" : "Not configured"}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                {!item.configured ? (
                  <p className="text-sm text-muted-foreground">
                    Add credentials to show status and metrics. See{" "}
                    <Link href="/docs/admin" className="text-primary underline">
                      Admin docs
                    </Link>{" "}
                    and <code className="text-xs bg-muted px-1 rounded">docs/SERVICES-ENV.md</code>.
                  </p>
                ) : item.error ? (
                  <p className="text-sm text-destructive">{item.error}</p>
                ) : (
                  <>
                    {item.status && (
                      <p className="text-sm text-muted-foreground">
                        Status: <span className="font-medium text-foreground">{item.status}</span>
                      </p>
                    )}
                    {item.metrics && Object.keys(item.metrics).length > 0 && (
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                        {Object.entries(item.metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-2">
                            <dt className="text-muted-foreground capitalize truncate">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </dt>
                            <dd className="font-medium text-foreground truncate">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </>
                )}
                {(artifacts?.[item.serviceId]?.themeUrl ?? artifacts?.[item.serviceId]?.dockerUrl) && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-2">
                    {artifacts?.[item.serviceId]?.themeUrl && (
                      <a
                        href={artifacts[item.serviceId].themeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Palette className="h-3 w-3" />
                        Theme
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {artifacts?.[item.serviceId]?.dockerUrl && (
                      <a
                        href={artifacts[item.serviceId].dockerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Dockerfile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
