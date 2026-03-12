"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Loader2, ImagePlus, ChevronDown, ChevronRight } from "lucide-react"

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif"

export type PanelRow = {
  id: string
  panel_number: number
  script_text: string | null
  asset_url: string | null
}

export type ChapterWithPanels = {
  id: string
  fragrance_name: string | null
  chapter_order: number
  panels: PanelRow[]
}

export function MangaChaptersPanels({
  chaptersWithPanels,
}: {
  chaptersWithPanels: ChapterWithPanels[]
}) {
  const router = useRouter()
  const [uploadingPanelId, setUploadingPanelId] = useState<string | null>(null)
  const [errorByPanelId, setErrorByPanelId] = useState<Record<string, string>>({})

  const handlePanelUpload = async (panelId: string, file: File) => {
    setErrorByPanelId((prev) => ({ ...prev, [panelId]: "" }))
    setUploadingPanelId(panelId)
    try {
      const formData = new FormData()
      formData.set("panelId", panelId)
      formData.set("file", file)
      const res = await fetch("/api/verse-backoffice/manga/upload-panel", {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorByPanelId((prev) => ({ ...prev, [panelId]: data.error ?? "Upload failed" }))
        return
      }
      router.refresh()
    } finally {
      setUploadingPanelId(null)
    }
  }

  if (!chaptersWithPanels?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chapters & panels</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No chapters. Add in Notion and sync, or insert into mnky_chapters.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chapters & panels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {chaptersWithPanels.map((ch) => (
          <ChapterPanelBlock
            key={ch.id}
            chapter={ch}
            uploadingPanelId={uploadingPanelId}
            errorByPanelId={errorByPanelId}
            onPanelUpload={handlePanelUpload}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function ChapterPanelBlock({
  chapter,
  uploadingPanelId,
  errorByPanelId,
  onPanelUpload,
}: {
  chapter: ChapterWithPanels
  uploadingPanelId: string | null
  errorByPanelId: Record<string, string>
  onPanelUpload: (panelId: string, file: File) => Promise<void>
}) {
  const [open, setOpen] = useState(true)
  const panels = chapter.panels ?? []

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm font-medium hover:bg-accent"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          #{chapter.chapter_order} {chapter.fragrance_name ?? "Chapter"}
          {panels.length > 0 && (
            <span className="text-muted-foreground font-normal">
              ({panels.length} panel{panels.length !== 1 ? "s" : ""})
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="ml-6 mt-1 space-y-3 border-l pl-4">
          {panels.length === 0 && (
            <li className="text-muted-foreground text-sm">No panels in this chapter.</li>
          )}
          {panels.map((panel) => (
            <PanelUploadRow
              key={panel.id}
              panel={panel}
              isUploading={uploadingPanelId === panel.id}
              error={errorByPanelId[panel.id]}
              onUpload={onPanelUpload}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function PanelUploadRow({
  panel,
  isUploading,
  error,
  onUpload,
}: {
  panel: PanelRow
  isUploading: boolean
  error: string | undefined
  onUpload: (panelId: string, file: File) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <li className="flex flex-wrap items-start gap-3 rounded-md border p-3">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded border bg-muted">
          {panel.asset_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={panel.asset_url}
              alt={`Panel ${panel.panel_number}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(panel.id, f)
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Upload"
          )}
        </Button>
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <span className="font-medium text-muted-foreground">Panel {panel.panel_number}</span>
        {panel.script_text && (
          <p className="mt-0.5 line-clamp-2 text-foreground">{panel.script_text}</p>
        )}
        {error && <p className="mt-1 text-destructive text-xs">{error}</p>}
      </div>
    </li>
  )
}
