"use client"

import useSWR from "swr"
import Link from "next/link"
import { Box, ExternalLink, Palette, FileCode } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ArtifactUrls = Record<string, { themeUrl?: string; dockerUrl?: string }>

export default function PlatformArtifactsPage() {
  const { data: artifacts, isLoading, error } = useSWR<ArtifactUrls>(
    "/api/labz/services/artifacts",
    fetcher,
    { revalidateOnFocus: false },
  )

  const serviceIds = artifacts ? Object.keys(artifacts) : []
  const hasAny = serviceIds.some((id) => artifacts![id].themeUrl || artifacts![id].dockerUrl)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Infra Artifacts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Published service themes and Dockerfiles from <code className="text-xs bg-muted px-1 rounded">infra/</code>. Publish with <code className="text-xs bg-muted px-1 rounded">pnpm run publish:infra</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Box className="h-4 w-4" />
            Current artifact URLs
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest theme and Dockerfile per service (from <code className="text-xs bg-muted px-1 rounded">infra_artifact_versions</code>). See also{" "}
            <Link href="/platform/services" className="text-primary underline">Service Analytics</Link> for per-service links.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">Failed to load artifact URLs.</p>
          ) : !hasAny ? (
            <p className="text-sm text-muted-foreground">
              No artifacts published yet. Run <code className="text-xs bg-muted px-1 rounded">pnpm run publish:infra</code> from repo root and ensure migrations are applied.
            </p>
          ) : (
            <ul className="space-y-3">
              {serviceIds.map((serviceId) => {
                const urls = artifacts![serviceId]
                if (!urls.themeUrl && !urls.dockerUrl) return null
                return (
                  <li key={serviceId} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                    <span className="text-sm font-medium capitalize">
                      {serviceId.replace(/-/g, " ")}
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {urls.themeUrl && (
                        <a
                          href={urls.themeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <Palette className="h-3.5 w-3.5" />
                          Theme CSS
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {urls.dockerUrl && (
                        <a
                          href={urls.dockerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <FileCode className="h-3.5 w-3.5" />
                          Dockerfile
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Docs</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/docs/admin" className="text-sm text-primary hover:underline">
            Admin docs (INFRA-STORAGE, SERVICES-ENV) →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
