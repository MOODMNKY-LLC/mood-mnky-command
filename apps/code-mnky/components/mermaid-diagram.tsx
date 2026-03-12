"use client"

import { useLayoutEffect, useId, useState } from "react"
import mermaid from "mermaid"

mermaid.initialize({ startOnLoad: false, theme: "neutral" })

export function MermaidDiagram({ diagram }: { diagram: string }) {
  const id = useId().replace(/:/g, "")
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useLayoutEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const { svg: out } = await mermaid.render(`mermaid-${id}`, diagram)
        if (!cancelled) {
          setSvg(out)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
          setSvg(null)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [diagram, id])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Diagram error: {error}
      </div>
    )
  }
  if (!svg) return <div className="min-h-[120px] animate-pulse rounded-lg bg-muted/50" />
  return (
    <div
      className="mermaid-wrap overflow-auto rounded-lg border border-border/50 bg-muted/20 p-4 [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
