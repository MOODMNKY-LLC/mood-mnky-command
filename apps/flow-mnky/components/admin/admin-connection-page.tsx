'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Zap, ZapOff, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PingResult {
  status: 'healthy' | 'unreachable' | 'unauthorized'
  latencyMs?: number
  error?: string
}

export function AdminConnectionPage() {
  const [ping, setPing] = useState<PingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [hostDisplay, setHostDisplay] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/flowise/config')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { hostDisplay?: string | null }) => setHostDisplay(d.hostDisplay ?? null))
      .catch(() => {})
  }, [])

  const runPing = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/flowise/ping')
      const data: PingResult = await res.json()
      setPing(data)
    } catch {
      setPing({ status: 'unreachable' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runPing() }, [])

  const statusBadge = ping
    ? {
        healthy: <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1"><Zap className="w-3 h-3" />Healthy</Badge>,
        unreachable: <Badge variant="destructive" className="gap-1"><ZapOff className="w-3 h-3" />Unreachable</Badge>,
        unauthorized: <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 gap-1"><ZapOff className="w-3 h-3" />Unauthorized</Badge>,
      }[ping.status]
    : null

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Flowise Connection</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and validate the connection to your self-hosted Flowise instance.
        </p>
      </div>

      <Card className="glass border-border/50 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status</span>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {statusBadge}
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={runPing} disabled={loading}>
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              Test
            </Button>
          </div>
        </div>

        {ping?.latencyMs !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Latency</span>
            <span className="font-mono text-foreground">{ping.latencyMs}ms</span>
          </div>
        )}

        {ping?.status === 'unreachable' && ping?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs font-medium text-destructive mb-1">Error (for debugging)</p>
            <p className="text-xs font-mono text-muted-foreground break-all">{ping.error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Ensure FLOWISE_HOST_URL and FLOWISE_API_KEY are set where the app runs (e.g. Vercel env). Flowise API expects Bearer JWT from app login or a valid API key.
            </p>
          </div>
        )}

        <Separator className="bg-border/50" />

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Host</span>
            <span className="font-mono text-xs text-foreground">
              {hostDisplay ?? '(not set or server-only)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">API Key</span>
            <span className="text-xs text-muted-foreground">•••••••• (server-side only)</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">API Base</span>
            <span className="font-mono text-xs text-foreground">/api/v1</span>
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
          <span>Flowise credentials are stored server-side only. They are never sent to the browser.</span>
        </div>

        {hostDisplay && (
          <Button variant="outline" size="sm" className="gap-1.5 w-fit" asChild>
            <a href={hostDisplay.startsWith('http') ? hostDisplay : `https://${hostDisplay}`} target="_blank" rel="noopener noreferrer">
              Open Flowise UI
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        )}
      </Card>
    </div>
  )
}
