'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { ExternalLink, Loader2, LayoutTemplate } from 'lucide-react'
import { formatFlowDataSummary } from '@/lib/flowise/format-flow-data'
import type { FlowiseChatflow } from '@/lib/flowise/client'

const DEPLOY_LABEL = 'Deployed'
const DEPLOY_DESCRIPTION = 'When on, this chatflow is live and can be used for chat. When off, it’s draft-only.'

async function toggleDeployed(id: string, current: boolean): Promise<boolean> {
  const target = !current
  const res = await fetch(`/api/admin/flowise/chatflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deployed: target }),
  })
  if (res.ok) return true
  if (res.status === 400) {
    const full = await fetchChatflow(id)
    if (!full) return false
    const res2 = await fetch(`/api/admin/flowise/chatflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...full, deployed: target }),
    })
    return res2.ok
  }
  return false
}

async function fetchChatflow(id: string): Promise<FlowiseChatflow | null> {
  const res = await fetch(`/api/admin/flowise/chatflows/${id}`)
  if (!res.ok) return null
  return res.json()
}

interface ChatflowsListProps {
  initialChatflows: FlowiseChatflow[]
}

export function ChatflowsList({ initialChatflows }: ChatflowsListProps) {
  const [chatflows, setChatflows] = useState<FlowiseChatflow[]>(initialChatflows)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [templateCache, setTemplateCache] = useState<Record<string, FlowiseChatflow>>({})

  const handleToggleDeploy = useCallback(async (c: FlowiseChatflow) => {
    setTogglingId(c.id)
    try {
      const ok = await toggleDeployed(c.id, c.deployed ?? false)
      if (ok) {
        setChatflows((prev) =>
          prev.map((f) =>
            f.id === c.id ? { ...f, deployed: !(f.deployed ?? false) } : f
          )
        )
      }
    } finally {
      setTogglingId(null)
    }
  }, [])

  const ensureTemplate = useCallback(async (id: string) => {
    if (templateCache[id]) return templateCache[id]
    const full = await fetchChatflow(id)
    if (full) setTemplateCache((prev) => ({ ...prev, [id]: full }))
    return full ?? null
  }, [templateCache])

  return (
    <ul className="rounded-xl border border-border/50 divide-y divide-border/50 overflow-hidden bg-card">
      {chatflows.map((c) => {
        const isDeployed = c.deployed ?? false
        return (
          <li
            key={c.id}
            className="px-6 py-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 hover:bg-muted/30 transition-colors"
          >
            <div className="min-w-0 flex-1 basis-64">
              <p className="font-medium tracking-tight">{c.name}</p>
              {c.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate" title={c.id}>
                ID: {c.id}
              </p>
            </div>

            <div className="flex items-center gap-6 shrink-0 flex-wrap">
              <div className="flex items-center gap-3">
                {togglingId === c.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Switch
                    id={`deploy-${c.id}`}
                    checked={isDeployed}
                    onCheckedChange={() => handleToggleDeploy(c)}
                    disabled={togglingId !== null}
                  />
                )}
                <label
                  htmlFor={`deploy-${c.id}`}
                  className="text-sm font-medium cursor-pointer select-none whitespace-nowrap"
                  title={DEPLOY_DESCRIPTION}
                >
                  {DEPLOY_LABEL}
                </label>
              </div>

              <div className="min-w-[4.5rem]">
                <Badge
                  variant={isDeployed ? 'default' : 'outline'}
                  className="font-normal text-xs"
                >
                  {isDeployed ? 'Live' : 'Draft'}
                </Badge>
              </div>

              <HoverCard
                openDelay={200}
                closeDelay={100}
                onOpenChange={(open) => open && ensureTemplate(c.id)}
              >
                <HoverCardTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Template
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent
                  side="left"
                  align="start"
                  className="w-[320px] max-h-[280px] overflow-hidden flex flex-col"
                >
                  <TemplateContent chatflow={c} full={templateCache[c.id]} />
                </HoverCardContent>
              </HoverCard>

              <Button variant="ghost" size="sm" asChild>
                <Link href={`/app/chat?chatflowId=${c.id}`} target="_blank">
                  Open
                  <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                </Link>
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function TemplateContent({
  chatflow,
  full,
}: {
  chatflow: FlowiseChatflow
  full: FlowiseChatflow | undefined
}) {
  const flowData = full?.flowData ?? chatflow.flowData
  const summary = formatFlowDataSummary(flowData)

  if (summary.nodeLabels.length === 0 && summary.edgeCount === 0) {
    if (!full && !chatflow.flowData) {
      return (
        <p className="text-sm text-muted-foreground">Loading template…</p>
      )
    }
    return (
      <p className="text-sm text-muted-foreground">
        No template data. Edit this chatflow in Flowise to add nodes.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Flow structure
      </p>
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">
          Nodes ({summary.nodeLabels.length})
        </p>
        <ul className="space-y-1 max-h-[140px] overflow-y-auto pr-1 text-sm">
          {summary.nodeLabels.map((label, i) => (
            <li
              key={`${i}-${label}`}
              className="pl-2 border-l-2 border-border/60 text-foreground/90"
            >
              {label}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Connections: {summary.edgeCount}
        </p>
      </div>
    </div>
  )
}
