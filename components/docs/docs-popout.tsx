"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FileCode, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type DocCategory = "admin" | "guide"

interface DocItem {
  slug: string
  title: string
}

interface DocsPopoutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional: open directly to a specific doc */
  initialCategory?: DocCategory
  initialSlug?: string
}

export function DocsPopout({
  open,
  onOpenChange,
  initialCategory = "guide",
  initialSlug,
}: DocsPopoutProps) {
  const [category, setCategory] = useState<DocCategory>(initialCategory)
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null)
  const [adminItems, setAdminItems] = useState<DocItem[]>([])
  const [guideItems, setGuideItems] = useState<DocItem[]>([])
  const [content, setContent] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ title?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)

  const fetchList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch("/api/docs")
      const data = await res.json()
      if (data.adminSlugs) {
        setAdminItems(data.adminSlugs)
        setGuideItems(data.guideSlugs)
      }
    } finally {
      setListLoading(false)
    }
  }, [])

  const fetchDoc = useCallback(async (cat: DocCategory, s: string) => {
    setLoading(true)
    setContent(null)
    setMeta(null)
    try {
      const res = await fetch(`/api/docs?category=${cat}&slug=${encodeURIComponent(s)}`)
      if (!res.ok) {
        if (res.status === 404) setContent("Doc not found.")
        return
      }
      const data = await res.json()
      setContent(data.content ?? "")
      setMeta(data.meta ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchList()
      if (initialSlug && initialCategory) {
        setCategory(initialCategory)
        setSlug(initialSlug)
        fetchDoc(initialCategory, initialSlug)
      } else {
        setSlug(null)
        setContent(null)
        setMeta(null)
      }
    }
  }, [open, initialSlug, initialCategory, fetchList, fetchDoc])

  const handleSelectDoc = (cat: DocCategory, s: string) => {
    setCategory(cat)
    setSlug(s)
    fetchDoc(cat, s)
  }

  const displayTitle = meta?.title ?? (slug ? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Docs")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            {displayTitle}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 min-h-0">
          <aside className="w-52 shrink-0 border-r border-border flex flex-col">
            <Tabs
              value={category}
              onValueChange={(v) => {
                setCategory(v as DocCategory)
                setSlug(null)
                setContent(null)
                setMeta(null)
              }}
              className="flex flex-col flex-1 min-h-0"
            >
              <TabsList className="mx-2 mt-2 grid w-[calc(100%-1rem)] grid-cols-2">
                <TabsTrigger value="guide" className="text-xs flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Guide
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs flex items-center gap-1">
                  <FileCode className="h-3 w-3" />
                  Admin
                </TabsTrigger>
              </TabsList>
              <TabsContent value="guide" className="flex-1 mt-2 mx-2 data-[state=inactive]:hidden">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  {listLoading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <nav className="flex flex-col gap-0.5 pb-4">
                      {guideItems.map((item) => (
                        <button
                          key={item.slug}
                          onClick={() => handleSelectDoc("guide", item.slug)}
                          className={cn(
                            "rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                            slug === item.slug ? "bg-accent font-medium" : "text-muted-foreground"
                          )}
                        >
                          {item.title}
                        </button>
                      ))}
                    </nav>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="admin" className="flex-1 mt-2 mx-2 data-[state=inactive]:hidden">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  {listLoading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <nav className="flex flex-col gap-0.5 pb-4">
                      {adminItems.map((item) => (
                        <button
                          key={item.slug}
                          onClick={() => handleSelectDoc("admin", item.slug)}
                          className={cn(
                            "rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                            slug === item.slug ? "bg-accent font-medium" : "text-muted-foreground"
                          )}
                        >
                          {item.title}
                        </button>
                      ))}
                    </nav>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </aside>

          <main className="flex-1 min-w-0 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-4rem)]">
              <div className="px-6 py-6">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </div>
                ) : content !== null ? (
                  <article className="prose prose-neutral dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children, ...props }) => {
                          if (href?.startsWith("http")) {
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                {children}
                              </a>
                            )
                          }
                          const docMatch = href?.match(/\/docs\/(admin|guide)\/([^?#]+)/)
                          if (docMatch) {
                            const [, cat, s] = docMatch
                            return (
                              <button
                                type="button"
                                onClick={() => handleSelectDoc(cat as DocCategory, s)}
                                className="text-primary hover:underline"
                              >
                                {children}
                              </button>
                            )
                          }
                          return <a href={href ?? "#"} {...props}>{children}</a>
                        },
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </article>
                ) : !slug ? (
                  <p className="text-sm text-muted-foreground py-8">
                    Select a doc from the list to view it.
                  </p>
                ) : null}
              </div>
            </ScrollArea>
          </main>
        </div>
      </SheetContent>
    </Sheet>
  )
}
