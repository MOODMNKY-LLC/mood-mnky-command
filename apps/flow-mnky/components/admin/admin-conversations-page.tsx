'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, Search, Trash2, AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowiseChatMessage, FlowiseChatflow } from '@/lib/flowise/client'

export function AdminConversationsPage() {
  const [chatflows, setChatflows] = useState<FlowiseChatflow[]>([])
  const [messages, setMessages] = useState<FlowiseChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedChatflow, setSelectedChatflow] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<FlowiseChatMessage | null>(null)

  useEffect(() => {
    fetch('/api/admin/flowise/chatflows')
      .then(r => r.ok ? r.json() : [])
      .then((data: FlowiseChatflow[]) => {
        setChatflows(data)
        if (data.length > 0) setSelectedChatflow(data[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedChatflow) return
    setLoading(true); setError(null)
    fetch(`/api/admin/flowise/messages?chatflowId=${selectedChatflow}&sort=DESC`)
      .then(r => r.ok ? r.json() : [])
      .then(setMessages)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedChatflow])

  const handleDeleteSession = async (chatId: string) => {
    if (!confirm(`Delete all messages for session ${chatId.slice(0, 8)}?`)) return
    await fetch('/api/admin/flowise/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatflowId: selectedChatflow }),
    })
    setMessages(prev => prev.filter(m => m.chatId !== chatId))
  }

  const grouped = messages.reduce<Record<string, FlowiseChatMessage[]>>((acc, m) => {
    const key = m.chatId || m.id
    ;(acc[key] ||= []).push(m)
    return acc
  }, {})

  const filteredKeys = Object.keys(grouped).filter(k =>
    grouped[k].some(m => m.content.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 flex flex-col gap-5 h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Conversations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inspect and manage chat history across all sessions.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedChatflow} onValueChange={setSelectedChatflow}>
          <SelectTrigger className="w-56 h-9 text-sm glass border-border/50">
            <SelectValue placeholder="Select chatflow" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-border/50">
            {chatflows.map(cf => <SelectItem key={cf.id} value={cf.id}>{cf.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm glass border-border/50" />
        </div>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSelectedChatflow(s => s)} disabled={loading}>
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </Button>
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
              <TableHead className="text-xs">Session</TableHead>
              <TableHead className="text-xs">Messages</TableHead>
              <TableHead className="text-xs">Last Message</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="w-20 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i} className="border-border/50">
                {Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
              </TableRow>
            )) : filteredKeys.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">
                  No conversations found for this chatflow.
                </TableCell>
              </TableRow>
            ) : (
              filteredKeys.map(chatId => {
                const msgs = grouped[chatId]
                const lastUser = [...msgs].reverse().find(m => m.role === 'userMessage')
                return (
                  <TableRow
                    key={chatId}
                    className="border-border/50 hover:bg-accent/30 cursor-pointer"
                    onClick={() => setSelected(msgs[0])}
                  >
                    <TableCell className="font-mono text-xs">{chatId.slice(0, 12)}…</TableCell>
                    <TableCell className="text-sm">{msgs.length}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {lastUser?.content?.slice(0, 60) ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {msgs[0].createdDate ? new Date(msgs[0].createdDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={e => { e.stopPropagation(); handleDeleteSession(chatId) }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="glass-strong border-border/50 w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm">Session {selected?.chatId?.slice(0, 16)}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-2">
            <div className="space-y-3">
              {selected && grouped[selected.chatId || selected.id]?.map(m => (
                <div key={m.id} className={cn(
                  'rounded-xl px-3 py-2.5 text-sm',
                  m.role === 'userMessage' ? 'bg-foreground text-background ml-8' : 'glass border border-border/40 mr-8'
                )}>
                  <p className="leading-relaxed">{m.content}</p>
                  {m.createdDate && <p className="text-[10px] opacity-50 mt-1">{new Date(m.createdDate).toLocaleString()}</p>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
