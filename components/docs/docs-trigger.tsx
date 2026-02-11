"use client"

import { useDocs } from "@/components/docs/docs-context"
import { cn } from "@/lib/utils"

type DocCategory = "admin" | "guide"

interface DocsTriggerProps {
  category: DocCategory
  slug: string
  children: React.ReactNode
  className?: string
}

/**
 * Renders a trigger that opens the docs popout to a specific doc.
 * Use on pages that need contextual help: <DocsTrigger category="guide" slug="blending-lab">View guide</DocsTrigger>
 */
export function DocsTrigger({ category, slug, children, className }: DocsTriggerProps) {
  const { openDocs } = useDocs()

  return (
    <button
      type="button"
      onClick={() => openDocs(category, slug)}
      className={cn("text-primary hover:underline text-sm", className)}
    >
      {children}
    </button>
  )
}
