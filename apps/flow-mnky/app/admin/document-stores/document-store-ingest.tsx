'use client'

import { useRef, useState } from 'react'
import type { FlowiseDocumentStore } from '@/lib/flowise/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload, X, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPT = '.pdf,.txt,.md,.csv,.json,.jsonl,.docx,.xlsx,.pptx'

interface DocumentStoreIngestProps {
  stores: FlowiseDocumentStore[]
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentStoreIngest({ stores }: DocumentStoreIngestProps) {
  const [storeId, setStoreId] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [step, setStep] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const next = Array.from(files)
    setSelectedFiles((prev) => {
      const keys = new Set(prev.map((f) => `${f.name}-${f.size}`))
      const added = next.filter((f) => {
        const key = `${f.name}-${f.size}`
        if (keys.has(key)) return false
        keys.add(key)
        return true
      })
      return prev.length ? [...prev, ...added] : added
    })
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setError(null)
  }

  const clearSuccess = () => {
    setSuccessMessage(null)
    setStep('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!storeId.trim() || selectedFiles.length === 0) return
    setError(null)
    setErrorHint(null)
    setSuccessMessage(null)
    setStep('uploading')

    const formData = new FormData()
    formData.set('storeId', storeId)
    selectedFiles.forEach((f) => formData.append('files', f))

    try {
      setStep('processing')
      const res = await fetch('/api/admin/flowise/document-stores/ingest', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = new Error(data?.error ?? `Upload failed (${res.status})`) as Error & { hint?: string }
        if (typeof data?.hint === 'string') err.hint = data.hint
        throw err
      }
      setStep('done')
      const added = data?.numAdded ?? data?.addedDocs?.length
      setSuccessMessage(
        added != null
          ? `Ingest complete. ${added} chunk(s) added. The agent can now use this content in conversation.`
          : 'Files ingested successfully. The agent can now use this content in conversation.'
      )
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Ingest failed')
      setErrorHint((err as Error & { hint?: string }).hint ?? null)
    }
  }

  if (stores.length === 0) {
    return (
      <section className="rounded-lg border border-border/50 bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          Create a knowledge base above first, then select it here to upload and ingest files.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border/50 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium">Upload and ingest (train)</h2>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>How it works:</strong> Choose a knowledge base, add your files (PDF, Word, text, etc.), then click Ingest. Flowise will load the documents, split them into chunks using a text splitter (e.g. Recursive Character Text Splitter), embed the chunks with your configured embedding model, and store them in the vector store. Your chat agent can then retrieve and use this content when answering questions.
          </p>
          <p>
            Chunk size, overlap, and embedding model are set when you configure the document store in Flowise (e.g. chunk size 1500, overlap 750). You can view or change these in the Flowise dashboard for this store.
          </p>
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-800 dark:text-amber-200">
            <strong>Setup required:</strong> New knowledge bases must be configured in Flowise before the first ingest. In Flowise, open Document Stores → select the store → add a Document Loader (e.g. PDF File), Text Splitter (e.g. Recursive Character Text Splitter), Embedding model, and Vector Store, then save. After that, Ingest here will work.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="store-select">Knowledge base</Label>
          <Select value={storeId} onValueChange={setStoreId} required>
            <SelectTrigger id="store-select" className="w-full max-w-sm">
              <SelectValue placeholder="Select a knowledge base" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Files to ingest</Label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-3.5 w-3.5" />
              Add files
            </Button>
          </div>
          {selectedFiles.length > 0 && (
            <ul className="mt-2 rounded-lg border border-border/50 divide-y divide-border/50 bg-muted/20 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-muted-foreground">{formatSize(file.size)}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Progress / status */}
        {(step === 'uploading' || step === 'processing') && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{step === 'uploading' ? 'Uploading files…' : 'Chunking & embedding…'}</span>
          </div>
        )}
        {step === 'done' && successMessage && (
          <div
            className={cn(
              'flex items-start gap-2 rounded-lg border p-3 text-sm',
              'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
            )}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{successMessage}</p>
              <Button type="button" variant="link" className="h-auto p-0 mt-1 text-xs" onClick={clearSuccess}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
        {step === 'error' && error && (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <p className="text-destructive">{error}</p>
            {errorHint && (
              <p className="text-muted-foreground">{errorHint}</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={!storeId || selectedFiles.length === 0 || step === 'uploading' || step === 'processing'}
        >
          {(step === 'uploading' || step === 'processing') ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ingesting…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Ingest / Train
            </>
          )}
        </Button>
      </form>
    </section>
  )
}
