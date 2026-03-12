'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { ingestFilesToDocumentStore } from '@/lib/actions/admin'
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
import { Loader2, Upload } from 'lucide-react'

interface DocumentStoreIngestProps {
  stores: FlowiseDocumentStore[]
}

function ingestAction(prev: Awaited<ReturnType<typeof ingestFilesToDocumentStore>> | null, formData: FormData) {
  return ingestFilesToDocumentStore(prev, formData)
}

export function DocumentStoreIngest({ stores }: DocumentStoreIngestProps) {
  const [storeId, setStoreId] = useState<string>('')
  const [state, formAction, isPending] = useActionState(ingestAction, null as Awaited<ReturnType<typeof ingestFilesToDocumentStore>> | null)

  if (stores.length === 0) {
    return (
      <section className="rounded-lg border border-border/50 bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          Create a document store in Flowise first, then you can ingest files here.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border/50 p-6 space-y-4">
      <h2 className="text-lg font-medium">Ingest files to vector store</h2>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="storeId" value={storeId} />
        <div className="space-y-2">
          <Label htmlFor="store-select">Document store</Label>
          <Select value={storeId} onValueChange={setStoreId} required>
            <SelectTrigger id="store-select" className="w-full max-w-sm">
              <SelectValue placeholder="Select a store" />
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
          <Label htmlFor="files">Files</Label>
          <input
            id="files"
            type="file"
            name="files"
            multiple
            accept=".pdf,.txt,.md,.csv,.json,.jsonl,.docx,.xlsx,.pptx"
            className="block w-full max-w-sm text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm"
          />
        </div>
        {state && !state.ok && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.ok && (
          <p className="text-sm text-primary">Files ingested successfully.</p>
        )}
        <Button type="submit" disabled={!storeId || isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ingesting...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Ingest to store
            </>
          )}
        </Button>
      </form>
    </section>
  )
}
