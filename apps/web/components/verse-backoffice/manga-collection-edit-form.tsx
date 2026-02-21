"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export interface MangaCollectionEditFormProps {
  collectionId: string
  initialName: string
  initialSlug: string
  hasNotionId?: boolean
}

export function MangaCollectionEditForm({
  collectionId,
  initialName,
  initialSlug,
  hasNotionId,
}: MangaCollectionEditFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [slug, setSlug] = useState(initialSlug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/verse-backoffice/manga/collections/${collectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, slug: slug.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Save failed")
        return
      }
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit collection</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coll-name">Name</Label>
            <Input id="coll-name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-md" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coll-slug">Slug</Label>
            <Input id="coll-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" className="max-w-md" />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          {hasNotionId && (
            <p className="text-muted-foreground text-xs">Changes are pushed to Notion when this collection is linked (notion_id).</p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
