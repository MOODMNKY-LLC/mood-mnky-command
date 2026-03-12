"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { BUCKETS } from "@/lib/supabase/storage"

export function UgcUploadClient() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [type, setType] = useState<"photo" | "video" | "story">("photo")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Choose a file")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const buf = await file.arrayBuffer()
      const hashBuf = await crypto.subtle.digest("SHA-256", buf)
      const mediaHash = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

      const ext = file.name.split(".").pop() ?? "bin"
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKETS.ugcSubmissions)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      const res = await fetch("/api/ugc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          caption: caption || undefined,
          mediaPath: path,
          mediaHash,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? res.statusText)
      }
      setFile(null)
      setCaption("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <select
              className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as "photo" | "video" | "story")}
            >
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="story">Story</option>
            </select>
          </div>
          <div>
            <Label>File</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="mt-1"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <Label>Caption (optional)</Label>
            <Textarea
              className="mt-1"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your moment..."
              rows={3}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading…" : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
