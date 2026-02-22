import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export function BoxCard({
  title,
  body,
  meta,
  href,
  cta = "Explore",
  media,
}: {
  title: string
  body?: string | null
  meta?: string | null
  href?: string | null
  cta?: string
  media?: React.ReactNode
}) {
  const content = (
    <Card className="border-mnkyBox-border-subtle bg-mnkyBox-surface-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-mnky-float">
      <CardContent className="p-5">
        {media ? (
          <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden bg-black/20">
            {media}
          </div>
        ) : null}
        <h3 className="text-lg font-bold tracking-tight text-mnkyBox-text">
          {title}
        </h3>
        {body ? (
          <p className="mt-2 text-sm leading-relaxed text-mnkyBox-text-secondary line-clamp-2">
            {body}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          {meta ? (
            <span className="text-[11px] uppercase tracking-[0.12em] text-mnkyBox-text-muted">
              {meta}
            </span>
          ) : <span />}
          {href ? (
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-mnkyBox-accent-primary hover:underline">
              {cta}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
