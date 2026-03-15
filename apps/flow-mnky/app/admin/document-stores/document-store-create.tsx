'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { adminCreateDocumentStore } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Database, Loader2 } from 'lucide-react'

export function DocumentStoreCreate() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await adminCreateDocumentStore({ name: name.trim(), description: description.trim() || undefined })
      setName('')
      setDescription('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rounded-lg border border-border/50 bg-muted/20 p-6 space-y-4">
      <h2 className="text-lg font-medium flex items-center gap-2">
        <Database className="w-4 h-4" />
        Create knowledge base
      </h2>
      <p className="text-sm text-muted-foreground">
        Create a new document store (knowledge base). Then select it below to upload and ingest files so the agent can retrieve and use them in conversation.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="store-name">Name</Label>
          <Input
            id="store-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Product docs"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="store-desc">Description (optional)</Label>
          <Textarea
            id="store-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this knowledge base"
            rows={2}
            disabled={pending}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create knowledge base'
          )}
        </Button>
      </form>
    </section>
  )
}
