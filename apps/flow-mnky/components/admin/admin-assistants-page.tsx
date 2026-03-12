'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Search, Trash2, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowiseAssistant } from '@/lib/flowise/client'

function parseAssistantDetails(raw: string) {
  try { return JSON.parse(raw) } catch { return {} }
}

export function AdminAssistantsPage() {
  const [assistants, setAssistants] = useState<FlowiseAssistant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/flowise/assistants')
      if (!res.ok) throw new Error(`${res.status}`)
      setAssistants(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assistants')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = assistants.filter(a => {
    const d = parseAssistantDetails(a.details)
    return (d.name ?? '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="p-6 flex flex-col gap-5 h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assistants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">OpenAI-style assistants configured in Flowise.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={load} disabled={loading}>
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search assistants…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm glass border-border/50" />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-xl border border-border/50 glass">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Model</TableHead>
              <TableHead className="text-xs">Tools</TableHead>
              <TableHead className="text-xs">Created</TableHead>
              <TableHead className="w-16 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} className="border-border/50">
                {Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
              </TableRow>
            )) : filtered.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">
                  No assistants found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(a => {
                const d = parseAssistantDetails(a.details)
                const tools: string[] = Array.isArray(d.tools) ? d.tools.map((t: { type?: string }) => t.type ?? t) : []
                return (
                  <TableRow key={a.id} className="border-border/50 hover:bg-accent/30">
                    <TableCell className="font-medium text-sm">{d.name ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{d.model ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tools.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-[10px] h-5">{t}</Badge>)}
                        {tools.length > 3 && <Badge variant="outline" className="text-[10px] h-5">+{tools.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.createdDate ? new Date(a.createdDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
