"use client"

import useSWR from "swr"
import Link from "next/link"
import { CheckCircle2, XCircle, Database, Store, MessageSquare, Workflow, Server, Gamepad2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type CredentialsStatus = {
  services: { serviceId: string; name: string; configured: boolean }[]
  notion: boolean
  shopify: boolean
  discord?: boolean
}

const INTEGRATION_LINKS: Record<string, { href: string; icon: React.ComponentType<{ className?: string }> }> = {
  notion: { href: "/notion", icon: Database },
  shopify: { href: "/store", icon: Store },
  discord: { href: "/platform/discord", icon: MessageSquare },
  steam: { href: "/platform/steam", icon: Gamepad2 },
  "mnky-cloud": { href: "/platform/services", icon: Server },
  "mnky-media": { href: "/platform/services", icon: Server },
  "mnky-drive": { href: "/platform/services", icon: Server },
  "mnky-auto": { href: "/platform/services", icon: Server },
  "mnky-agents": { href: "/platform/flowise", icon: Workflow },
  "mnky-games": { href: "/platform/services", icon: Server },
}

export default function PlatformIntegrationsPage() {
  const { data: creds, isLoading, error } = useSWR<CredentialsStatus>(
    "/api/labz/settings/credentials-status",
    fetcher,
    { revalidateOnFocus: false },
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connected services and credentials status at a glance.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Failed to load integrations status.</p>
          </CardContent>
        </Card>
      ) : creds ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                Notion
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {creds.notion ? (
                <Badge className="w-fit bg-success/10 text-success border-0 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Configured
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-fit gap-1">
                  <XCircle className="h-3 w-3" /> Not configured
                </Badge>
              )}
              <Link href="/notion" className="text-xs text-primary hover:underline">
                Notion Sync →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Store className="h-4 w-4" />
                Shopify
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {creds.shopify ? (
                <Badge className="w-fit bg-success/10 text-success border-0 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Configured
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-fit gap-1">
                  <XCircle className="h-3 w-3" /> Not configured
                </Badge>
              )}
              <Link href="/store" className="text-xs text-primary hover:underline">
                Store →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discord
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {creds.discord ? (
                <Badge className="w-fit bg-success/10 text-success border-0 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Configured
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-fit gap-1">
                  <XCircle className="h-3 w-3" /> Not configured
                </Badge>
              )}
              <Link href="/platform/discord" className="text-xs text-primary hover:underline">
                Discord control →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Steam
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {creds.steam ? (
                <Badge className="w-fit bg-success/10 text-success border-0 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Configured
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-fit gap-1">
                  <XCircle className="h-3 w-3" /> Not configured
                </Badge>
              )}
              <Link href="/platform/steam" className="text-xs text-primary hover:underline">
                Steam →
              </Link>
            </CardContent>
          </Card>
          {creds.services.map((s) => {
            const link = INTEGRATION_LINKS[s.serviceId]
            const Icon = link?.icon ?? Server
            return (
              <Card key={s.serviceId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {s.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {s.configured ? (
                    <Badge className="w-fit bg-success/10 text-success border-0 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="w-fit gap-1">
                      <XCircle className="h-3 w-3" /> Not configured
                    </Badge>
                  )}
                  {link && (
                    <Link href={link.href} className="text-xs text-primary hover:underline">
                      {link.href === "/platform/services" ? "Service Analytics →" : "Open →"}
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
