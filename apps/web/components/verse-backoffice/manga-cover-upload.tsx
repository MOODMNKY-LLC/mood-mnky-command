"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ImagePlus } from "lucide-react"

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif"

export function MangaCoverUpload({
  issueId,
  currentCoverUrl,
}: {
  issueId: string
  currentCoverUrl: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("issueId", issueId)
      formData.set("file", file)
      const res = await fetch("/api/verse-backoffice/manga/upload-cover", {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Upload failed")
        return
      }
      router.refresh()
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cover</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentCoverUrl && (
          <div className="relative aspect-[3/4] max-w-[200px] overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentCoverUrl}
              alt="Issue cover"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {!currentCoverUrl && (
          <div className="flex max-w-[200px] items-center justify-center rounded-md border border-dashed bg-muted/50 aspect-[3/4] text-muted-foreground">
            <ImagePlus className="h-10 w-10" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentCoverUrl ? (
            "Change cover"
          ) : (
            "Upload cover"
          )}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
