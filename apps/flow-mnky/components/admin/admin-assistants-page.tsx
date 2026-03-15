'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, Search, Trash2, AlertCircle, Pencil, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowiseAssistant, FlowiseCredential } from '@/lib/flowise/client'

interface AssistantDetails {
  name?: string
  description?: string
  instructions?: string
  model?: string
  tools?: Array<string | { type?: string; [key: string]: unknown }>
  [key: string]: unknown
}

interface AssistantFormState {
  name: string
  description: string
  instructions: string
  model: string
  credential: string
  toolsJson: string
  iconSrc: string
}

const EMPTY_FORM: AssistantFormState = {
  name: '',
  description: '',
  instructions: '',
  model: '',
  credential: '',
  toolsJson: '[]',
  iconSrc: '',
}

function parseAssistantDetails(raw: string): AssistantDetails {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function toAssistantForm(details: AssistantDetails, iconSrc?: string): AssistantFormState {
  return {
    name: typeof details.name === 'string' ? details.name : '',
    description: typeof details.description === 'string' ? details.description : '',
    instructions: typeof details.instructions === 'string' ? details.instructions : '',
    model: typeof details.model === 'string' ? details.model : '',
    credential: '',
    toolsJson: JSON.stringify(Array.isArray(details.tools) ? details.tools : [], null, 2),
    iconSrc: iconSrc ?? '',
  }
}

function buildAssistantPayload(
  form: AssistantFormState,
  existingDetails?: AssistantDetails
): { details: string; iconSrc?: string } {
  const parsedTools = JSON.parse(form.toolsJson || '[]')
  const nextDetails: AssistantDetails = {
    ...(existingDetails ?? {}),
    name: form.name.trim(),
    description: form.description.trim(),
    instructions: form.instructions.trim(),
    model: form.model.trim(),
    tools: Array.isArray(parsedTools) ? parsedTools : [],
  }

  return {
    details: JSON.stringify(nextDetails),
    iconSrc: form.iconSrc.trim() || undefined,
    credential: form.credential.trim() || undefined,
  }
}

function getCredentialLabel(credential: FlowiseCredential) {
  return credential.name ?? credential.credentialName ?? credential.id
}

export function AdminAssistantsPage() {
  const [assistants, setAssistants] = useState<FlowiseAssistant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingAssistant, setEditingAssistant] = useState<FlowiseAssistant | null>(null)
  const [form, setForm] = useState<AssistantFormState>(EMPTY_FORM)
  const [credentials, setCredentials] = useState<FlowiseCredential[]>([])
  const [credentialsLoading, setCredentialsLoading] = useState(false)
  const [credentialError, setCredentialError] = useState<string | null>(null)

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

  useEffect(() => {
    let isCancelled = false

    const loadCredentials = async () => {
      setCredentialsLoading(true)
      setCredentialError(null)
      try {
        const res = await fetch('/api/admin/flowise/credentials')
        if (!res.ok) {
          throw new Error(`${res.status}`)
        }

        const data = (await res.json()) as FlowiseCredential[]
        if (!isCancelled) {
          setCredentials(data)
        }
      } catch (e) {
        if (!isCancelled) {
          setCredentials([])
          setCredentialError(e instanceof Error ? e.message : 'Failed to load credentials')
        }
      } finally {
        if (!isCancelled) {
          setCredentialsLoading(false)
        }
      }
    }

    loadCredentials()
    return () => {
      isCancelled = true
    }
  }, [])

  const openCreate = () => {
    setEditingAssistant(null)
    setForm(EMPTY_FORM)
    setError(null)
    setSheetOpen(true)
  }

  const openEdit = (assistant: FlowiseAssistant) => {
    setEditingAssistant(assistant)
    setForm({
      ...toAssistantForm(parseAssistantDetails(assistant.details), assistant.iconSrc),
      credential: assistant.credential ?? '',
    })
    setError(null)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Assistant name is required.')
      return
    }

    if (!form.credential.trim()) {
      setError('Assistant credential is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = buildAssistantPayload(
        form,
        editingAssistant ? parseAssistantDetails(editingAssistant.details) : undefined
      )
      const res = await fetch('/api/admin/flowise/assistants', {
        method: editingAssistant ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAssistant ? { id: editingAssistant.id, ...payload } : payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `${res.status}`)
      }

      const saved = (await res.json()) as FlowiseAssistant
      setAssistants((prev) =>
        editingAssistant
          ? prev.map((assistant) => (assistant.id === saved.id ? saved : assistant))
          : [saved, ...prev]
      )
      setSheetOpen(false)
      setEditingAssistant(null)
      setForm(EMPTY_FORM)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save assistant')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (assistantId: string) => {
    if (!confirm('Delete this assistant from Flowise?')) return

    try {
      const res = await fetch('/api/admin/flowise/assistants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assistantId }),
      })

      if (!res.ok) {
        throw new Error(`${res.status}`)
      }

      setAssistants((prev) => prev.filter((assistant) => assistant.id !== assistantId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete assistant')
    }
  }

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

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" />
          New Assistant
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
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Model</TableHead>
              <TableHead className="text-xs">Tools</TableHead>
              <TableHead className="text-xs">Created</TableHead>
                <TableHead className="w-24 text-xs">Actions</TableHead>
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(a.id)}
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

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) {
            setEditingAssistant(null)
            setForm(EMPTY_FORM)
          }
        }}
      >
        <SheetContent className="glass-strong border-border/50 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingAssistant ? 'Edit Assistant' : 'New Assistant'}</SheetTitle>
            <SheetDescription>
              Configure a Flowise assistant using structured fields mapped into the assistant details payload.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="assistant-name">Name</Label>
              <Input
                id="assistant-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="MNKY Research Assistant"
                className="glass border-border/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistant-description">Description</Label>
              <Input
                id="assistant-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Short summary shown in Flowise"
                className="glass border-border/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistant-credential">Credential</Label>
              {credentials.length > 0 ? (
                <Select
                  value={form.credential}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, credential: value }))}
                >
                  <SelectTrigger id="assistant-credential" className="glass border-border/50">
                    <SelectValue placeholder={credentialsLoading ? 'Loading credentials...' : 'Select a credential'} />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/50">
                    {credentials.map((credential) => (
                      <SelectItem key={credential.id} value={credential.id}>
                        {getCredentialLabel(credential)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="assistant-credential"
                  value={form.credential}
                  onChange={(e) => setForm((prev) => ({ ...prev, credential: e.target.value }))}
                  placeholder="Enter Flowise credential ID"
                  className="glass border-border/50 font-mono"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {credentials.length > 0
                  ? 'Choose the credential Flowise should use for this assistant.'
                  : credentialError
                    ? 'Credential auto-discovery is unavailable. Enter a valid Flowise credential ID manually.'
                    : 'Enter a valid Flowise credential ID manually.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistant-model">Model</Label>
              <Input
                id="assistant-model"
                value={form.model}
                onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="gpt-4o-mini"
                className="glass border-border/50 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistant-icon">Icon URL</Label>
              <Input
                id="assistant-icon"
                value={form.iconSrc}
                onChange={(e) => setForm((prev) => ({ ...prev, iconSrc: e.target.value }))}
                placeholder="https://..."
                className="glass border-border/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistant-instructions">Instructions</Label>
              <Textarea
                id="assistant-instructions"
                value={form.instructions}
                onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                placeholder="You are a helpful assistant..."
                className="min-h-32 glass border-border/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistant-tools">Tools JSON</Label>
              <Textarea
                id="assistant-tools"
                value={form.toolsJson}
                onChange={(e) => setForm((prev) => ({ ...prev, toolsJson: e.target.value }))}
                placeholder='[{"type":"retrieval"}]'
                className="min-h-32 glass border-border/50 font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Provide an array of Flowise/OpenAI-style tool descriptors. Invalid JSON will be rejected before save.
              </p>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? (editingAssistant ? 'Saving…' : 'Creating…') : editingAssistant ? 'Save Assistant' : 'Create Assistant'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
