"use client"

import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Gamepad2, Server, ExternalLink, BarChart3 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type SteamAnalytics = {
  configured: boolean
  realmSet: boolean
  returnUrlSet: boolean
  linkedCount: number
}

type ServiceAnalyticsItem = {
  serviceId: string
  name: string
  configured: boolean
  status?: string
  metrics?: Record<string, number | string>
  error?: string
}

export default function PlatformSteamPage() {
  const { data: steam, isLoading: steamLoading, error: steamError } = useSWR<SteamAnalytics>(
    "/api/labz/steam/analytics",
    fetcher,
    { revalidateOnFocus: false },
  )
  const { data: services } = useSWR<ServiceAnalyticsItem[]>(
    "/api/labz/services/analytics",
    fetcher,
    { revalidateOnFocus: false },
  )
  const mnkyGames = services?.find((s) => s.serviceId === "mnky-games")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Gamepad2 className="h-6 w-6" />
          Steam
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Steam Web API config, linked accounts, and link to MNKY GAMES (Service Analytics).
        </p>
      </div>

      {steamLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      ) : steamError ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Failed to load Steam analytics.</p>
          </CardContent>
        </Card>
      ) : steam ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Config</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Steam Web API key</span>
                {steam.configured ? (
                  <Badge className="bg-success/10 text-success border-0">Set</Badge>
                ) : (
                  <Badge variant="secondary">Not set</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Realm</span>
                {steam.realmSet ? (
                  <Badge className="bg-success/10 text-success border-0">Set</Badge>
                ) : (
                  <Badge variant="secondary">Not set</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Return URL</span>
                {steam.returnUrlSet ? (
                  <Badge className="bg-success/10 text-success border-0">Set</Badge>
                ) : (
                  <Badge variant="secondary">Not set</Badge>
                )}
              </div>
              <Link
                href="/main/services/mnky-games"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                MNKY GAMES (public)
                <ExternalLink className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Linked Steam accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{steam.linkedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Profiles with Steam linked (steamid64 set)
              </p>
            </CardContent>
          </Card>

          {mnkyGames && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  MNKY GAMES
                </CardTitle>
                <Badge
                  variant={mnkyGames.configured ? "default" : "secondary"}
                  className={mnkyGames.configured ? "bg-success/10 text-success border-0" : ""}
                >
                  {mnkyGames.configured ? "Configured" : "Not configured"}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {mnkyGames.configured && mnkyGames.status && (
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="font-medium text-foreground">{mnkyGames.status}</span>
                  </p>
                )}
                {mnkyGames.error && (
                  <p className="text-sm text-destructive">{mnkyGames.error}</p>
                )}
                <Link
                  href="/platform/services"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  Service Analytics
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}
