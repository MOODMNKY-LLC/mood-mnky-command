"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

type Row = {
  id: string
  type: string
  caption: string | null
  media_path: string
  status: string
  created_at: string
  profile_id: string
}

export function UgcModerationClient({ submissions }: { submissions: Row[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const handleModerate = async (id: string, status: "approved" | "rejected") => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/ugc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          moderationNotes: notes[id] ?? undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <ul className="divide-y space-y-4">
      {submissions.map((s) => (
        <li key={s.id} className="pt-3 first:pt-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Badge variant="outline" className="mb-1">{s.type}</Badge>
              <p className="text-sm">{s.caption ?? "(no caption)"}</p>
              <p className="text-muted-foreground text-xs">{s.media_path} · {new Date(s.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                disabled={loadingId === s.id}
                onClick={() => handleModerate(s.id, "approved")}
              >
                {loadingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={loadingId === s.id}
                onClick={() => handleModerate(s.id, "rejected")}
              >
                {loadingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </Button>
            </div>
          </div>
          <Textarea
            placeholder="Moderation notes (optional)"
            className="mt-2 h-20 text-sm"
            value={notes[s.id] ?? ""}
            onChange={(e) => setNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
          />
        </li>
      ))}
    </ul>
  )
}
