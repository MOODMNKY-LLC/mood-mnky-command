'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, ExternalLink, RefreshCw, Search, Workflow } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { N8nConfigSummary, N8nPingResult, N8nWorkflow } from '@/lib/n8n/client'

export function AdminN8nPage() {
  const [config, setConfig] = useState<N8nConfigSummary | null>(null)
  const [ping, setPing] = useState<N8nPingResult | null>(null)
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [configRes, pingRes, workflowsRes] = await Promise.all([
        fetch('/api/admin/n8n/config'),
        fetch('/api/admin/n8n/ping'),
        fetch('/api/admin/n8n/workflows'),
      ])

      const configData = configRes.ok
        ? ((await configRes.json()) as N8nConfigSummary)
        : null
      const pingData = pingRes.ok
        ? ((await pingRes.json()) as N8nPingResult)
        : null
      type WorkflowsPayload = { workflows?: N8nWorkflow[]; configured?: boolean; error?: string }
      const workflowsPayload: WorkflowsPayload | null = workflowsRes.ok
        ? ((await workflowsRes.json()) as WorkflowsPayload)
        : await workflowsRes.json().catch(() => null).then((b) => b as WorkflowsPayload | null)

      setConfig(configData)
      setPing(pingData)
      setWorkflows(workflowsPayload?.workflows ?? [])

      if (!configRes.ok || !pingRes.ok) {
        throw new Error('Failed to load n8n config or ping.')
      }
      if (!workflowsRes.ok) {
        if (workflowsPayload?.configured === true) {
          throw new Error(
            'n8n is configured but unreachable. Check that the instance is running and N8N_BASE_URL (or N8N_API_URL) is correct.'
          )
        }
        throw new Error(workflowsPayload?.error ?? 'Failed to load workflows.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load n8n data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredWorkflows = useMemo(
    () =>
      workflows.filter((workflow) =>
        workflow.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, workflows]
  )

  const statusBadge = ping
    ? {
        healthy: (
          <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
            Healthy
          </Badge>
        ),
        unreachable: <Badge variant="destructive">Unreachable</Badge>,
        unauthorized: (
          <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30">
            Unauthorized
          </Badge>
        ),
        not_configured: <Badge variant="outline">Not configured</Badge>,
      }[ping.status]
    : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">n8n Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor the n8n connection and browse workflows that can be wired into Flowise,
            chat actions, and backoffice automations.
          </p>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={load} disabled={loading}>
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connection</CardTitle>
            <CardDescription>Server-side n8n API access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Status</span>
              {loading ? <Skeleton className="h-5 w-20" /> : statusBadge}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-mono text-xs">{ping?.latencyMs ? `${ping.latencyMs}ms` : '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Base URL</span>
              <span className="font-mono text-xs text-right break-all">{config?.hostDisplay ?? '—'}</span>
            </div>
            {config?.hostDisplay && (
              <Button variant="ghost" size="sm" className="gap-1.5 px-0" asChild>
                <a href={config.hostDisplay} target="_blank" rel="noopener noreferrer">
                  Open n8n
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Workflow Relay</CardTitle>
            <CardDescription>Ready for future trigger wiring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Webhook Base</span>
              <span className="font-mono text-xs text-right break-all">
                {config?.webhookBaseUrl ?? '—'}
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              This scaffold establishes the connection surface and workflow discovery layer first.
              Next we can wire authenticated relay endpoints for Flowise tools and app-side events.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Discovered Workflows</CardTitle>
            <CardDescription>Read-only catalog from the n8n API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Total</span>
              <span>{loading ? '—' : workflows.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Active</span>
              <span>{loading ? '—' : workflows.filter((workflow) => workflow.active).length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search workflows…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <div className="overflow-auto rounded-xl border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Workflow className="w-5 h-5 opacity-50" />
                      {config?.configured
                        ? 'No workflows found in n8n.'
                        : 'Configure N8N_BASE_URL and N8N_API_KEY to browse workflows.'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.name}</TableCell>
                    <TableCell>
                      <Badge variant={workflow.active ? 'default' : 'outline'}>
                        {workflow.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {workflow.id}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
