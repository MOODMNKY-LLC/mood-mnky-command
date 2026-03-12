"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export interface MangaIssueEditFormProps {
  issueId: string
  initialTitle: string
  initialSlug: string
  initialStatus: "draft" | "published"
  initialArcSummary: string | null
  initialPublishedAt: string | null
  collectionName?: string
  issueNumber?: number
  hasNotionId?: boolean
}

export function MangaIssueEditForm({
  issueId,
  initialTitle,
  initialSlug,
  initialStatus,
  initialArcSummary,
  initialPublishedAt,
  collectionName,
  issueNumber,
  hasNotionId,
}: MangaIssueEditFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [slug, setSlug] = useState(initialSlug)
  const [status, setStatus] = useState<"draft" | "published">(initialStatus)
  const [arcSummary, setArcSummary] = useState(initialArcSummary ?? "")
  const [publishedAt, setPublishedAt] = useState(
    initialPublishedAt ? initialPublishedAt.slice(0, 10) : ""
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/verse-backoffice/manga/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          slug: slug.trim() || undefined,
          status,
          arc_summary: arcSummary.trim() || null,
          published_at: publishedAt ? `${publishedAt}T00:00:00.000Z` : null,
        }),
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
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {collectionName !== undefined && (
          <p className="text-muted-foreground text-sm">Collection: {collectionName ?? "—"}</p>
        )}
        {issueNumber !== undefined && (
          <p className="text-muted-foreground text-sm">Issue # {issueNumber}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue-title">Title</Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-slug">Slug</Label>
            <Input
              id="issue-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-slug"
              className="max-w-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-status">Status</Label>
            <select
              id="issue-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="flex h-9 max-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-arc-summary">Arc Summary</Label>
            <textarea
              id="issue-arc-summary"
              value={arcSummary}
              onChange={(e) => setArcSummary(e.target.value)}
              rows={3}
              className="flex min-h-[60px] w-full max-w-md rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-published-at">Published Date</Label>
            <Input
              id="issue-published-at"
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="max-w-[180px]"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          {hasNotionId && (
            <p className="text-muted-foreground text-xs">
              Changes are pushed to Notion when this issue is linked (notion_id).
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
