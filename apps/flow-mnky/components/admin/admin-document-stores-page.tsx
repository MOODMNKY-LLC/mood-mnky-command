'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Search, Trash2, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowiseDocumentStore } from '@/lib/flowise/client'

const statusColors: Record<string, string> = {
  SYNC:    'border-green-500/30 text-green-600 bg-green-500/10',
  SYNCING: 'border-yellow-500/30 text-yellow-600 bg-yellow-500/10',
  STALE:   'border-orange-500/30 text-orange-600 bg-orange-500/10',
  EMPTY:   'border-border/50 text-muted-foreground',
  NEW:     'border-blue-500/30 text-blue-600 bg-blue-500/10',
}

export function AdminDocumentStoresPage() {
  const [stores, setStores] = useState<FlowiseDocumentStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/flowise/document-stores')
      if (!res.ok) throw new Error(`${res.status}`)
      setStores(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load document stores')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete document store "${name}"? This will remove all associated data.`)) return
    await fetch('/api/admin/flowise/document-stores', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setStores(prev => prev.filter(s => s.id !== id))
  }

  const filtered = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 flex flex-col gap-5 h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Document Stores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage vector-backed document stores used in your chatflows.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={load} disabled={loading}>
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search stores…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm glass border-border/50" />
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
              <TableHead className="text-xs">Description</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Updated</TableHead>
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
                  No document stores found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(s => (
                <TableRow key={s.id} className="border-border/50 hover:bg-accent/30">
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{s.description ?? '—'}</TableCell>
                  <TableCell>
                    {s.status && (
                      <Badge variant="outline" className={cn('text-[10px] h-5', statusColors[s.status] ?? 'border-border/50 text-muted-foreground')}>
                        {s.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.updatedDate ? new Date(s.updatedDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s.id, s.name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
