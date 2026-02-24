"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Panel = {
  id: string
  panel_number: number
  script_text: string | null
  asset_url: string | null
  hotspots: Array<{
    id: string
    shopify_gid: string
    x: number
    y: number
    label: string | null
    tooltip: string | null
    href?: string
  }>
}

export function ChapterReaderClient({
  issueId,
  chapterId,
  panels,
  sessionId,
}: {
  issueId: string
  chapterId: string
  panels: Panel[]
  sessionId: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startTime = useRef(Date.now())
  const [reported, setReported] = useState(false)

  useEffect(() => {
    if (reported || panels.length === 0) return

    const checkProgress = () => {
      const el = containerRef.current
      if (!el) return
      const { scrollTop, scrollHeight, clientHeight } = el
      const percent = scrollHeight > 0 ? Math.round((scrollTop + clientHeight) / scrollHeight * 100) : 0
      const activeSeconds = Math.floor((Date.now() - startTime.current) / 1000)
      if (percent >= 80 && activeSeconds >= 90) {
        setReported(true)
        fetch("/api/mag/read-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueId,
            chapterId,
            sessionId,
            percentRead: percent,
            activeSeconds,
            completed: true,
          }),
        }).catch(console.error)
      }
    }

    const el = containerRef.current
    el?.addEventListener("scroll", checkProgress)
    const t = setInterval(checkProgress, 2000)
    return () => {
      el?.removeEventListener("scroll", checkProgress)
      clearInterval(t)
    }
  }, [issueId, chapterId, sessionId, panels.length, reported])

  return (
    <div
      ref={containerRef}
      className="space-y-8 overflow-y-auto"
      style={{ maxHeight: "80vh" }}
    >
      {panels.map((panel) => (
        <figure key={panel.id} className="space-y-2">
          {panel.asset_url && (
            <div className="relative aspect-[3/4] max-w-2xl overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={panel.asset_url}
                alt={`Panel ${panel.panel_number}`}
                className="h-full w-full object-cover"
              />
              {panel.hotspots.length > 0 && (
                <div className="absolute inset-0">
                  {panel.hotspots.map((h) => (
                    <Link
                      key={h.id}
                      href={h.href ?? "/dojo/products"}
                      className="absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/80 text-primary-foreground text-xs transition-transform hover:scale-110"
                      style={{
                        left: `${h.x * 100}%`,
                        top: `${h.y * 100}%`,
                      }}
                      title={h.tooltip ?? h.label ?? "View product"}
                    >
                      +
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {panel.script_text && (
            <figcaption className="text-muted-foreground text-sm">
              {panel.script_text}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
