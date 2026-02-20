"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { DocsPopout } from "@/components/docs/docs-popout"

type DocCategory = "admin" | "guide"

interface DocsContextValue {
  openDocs: (category?: DocCategory, slug?: string) => void
}

const DocsContext = createContext<DocsContextValue | null>(null)

export function useDocs() {
  const ctx = useContext(DocsContext)
  if (!ctx) return { openDocs: () => {} }
  return ctx
}

export function DocsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialCategory, setInitialCategory] = useState<DocCategory>("guide")
  const [initialSlug, setInitialSlug] = useState<string | undefined>()

  const openDocs = useCallback((category: DocCategory = "guide", slug?: string) => {
    setInitialCategory(category)
    setInitialSlug(slug)
    setOpen(true)
  }, [])

  return (
    <DocsContext.Provider value={{ openDocs }}>
      {children}
      <DocsPopout
        open={open}
        onOpenChange={setOpen}
        initialCategory={initialCategory}
        initialSlug={initialSlug}
      />
    </DocsContext.Provider>
  )
}
