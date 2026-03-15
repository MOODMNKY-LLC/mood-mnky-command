'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { adminDeleteDocumentStore } from '@/lib/actions/admin'
import type { FlowiseDocumentStore } from '@/lib/flowise/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'

interface DocumentStoreListProps {
  stores: FlowiseDocumentStore[]
}

const statusLabel: Record<string, string> = {
  EMPTY: 'Empty',
  SYNC: 'Synced',
  SYNCING: 'Syncing…',
  STALE: 'Stale',
  NEW: 'New',
}

export function DocumentStoreList({ stores }: DocumentStoreListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await adminDeleteDocumentStore(id)
      setConfirmId(null)
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  if (stores.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-medium mb-3">Knowledge bases</h2>
        <p className="text-sm text-muted-foreground">
          No document stores yet. Create one above, then upload and ingest files.
        </p>
      </section>
    )
  }

  return (
    <>
      <section>
        <h2 className="text-lg font-medium mb-3">Knowledge bases</h2>
        <ul className="rounded-lg border border-border/50 divide-y divide-border/50">
          {stores.map((s) => (
            <li key={s.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {s.id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground capitalize">
                  {statusLabel[s.status ?? ''] ?? (s.status ?? '—')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmId(s.id)}
                  disabled={deletingId !== null}
                  aria-label={`Delete ${s.name}`}
                >
                  {deletingId === s.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <AlertDialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete knowledge base?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the document store and its ingested data from Flowise. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId && handleDelete(confirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
