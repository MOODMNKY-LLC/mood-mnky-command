'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { RefreshCw, Search, Trash2, Plus, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowiseVariable } from '@/lib/flowise/client'

export function AdminVariablesPage() {
  const [variables, setVariables] = useState<FlowiseVariable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newVar, setNewVar] = useState({ name: '', value: '', type: 'string' as FlowiseVariable['type'] })
  const [saving, setSaving] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/flowise/variables')
      if (!res.ok) throw new Error(`${res.status}`)
      setVariables(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load variables')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newVar.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/flowise/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVar),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const created = await res.json()
      setVariables(prev => [...prev, created])
      setSheetOpen(false)
      setNewVar({ name: '', value: '', type: 'string' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create variable')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variable?')) return
    await fetch('/api/admin/flowise/variables', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setVariables(prev => prev.filter(v => v.id !== id))
  }

  const toggleReveal = (id: string) => setRevealed(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const filtered = variables.filter(v => v.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 flex flex-col gap-5 h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Variables</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Global variables available to all chatflows in Flowise.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={load} disabled={loading}>
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setSheetOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            New Variable
          </Button>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search variables…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm glass border-border/50" />
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
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Value</TableHead>
              <TableHead className="w-20 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} className="border-border/50">
                {Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
              </TableRow>
            )) : filtered.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-12">
                  No variables found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(v => (
                <TableRow key={v.id} className="border-border/50 hover:bg-accent/30">
                  <TableCell className="font-mono text-sm">{v.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] h-5 capitalize">{v.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate">
                        {revealed.has(v.id) ? v.value : '••••••••'}
                      </span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => toggleReveal(v.id)}>
                        {revealed.has(v.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="glass-strong border-border/50">
          <SheetHeader>
            <SheetTitle>New Variable</SheetTitle>
            <SheetDescription>Create a global variable accessible to all Flowise chatflows.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="MY_VARIABLE" value={newVar.name} onChange={e => setNewVar(p => ({ ...p, name: e.target.value }))} className="font-mono glass border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={newVar.type} onValueChange={v => setNewVar(p => ({ ...p, type: v as FlowiseVariable['type'] }))}>
                <SelectTrigger className="glass border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border/50">
                  {['string', 'number', 'boolean', 'json'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input placeholder="value" value={newVar.value} onChange={e => setNewVar(p => ({ ...p, value: e.target.value }))} className="font-mono glass border-border/50" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={saving || !newVar.name.trim()}>
              {saving ? 'Creating…' : 'Create Variable'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
