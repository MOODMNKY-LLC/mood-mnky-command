"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { FileText, ExternalLink, Loader2, Plus, Pencil, RefreshCw, BookOpen, ChevronLeft, ChevronRight, Search, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PAGES_TABLE_PAGE_SIZE = 15

/** Known repo templates that can be uploaded from disk without sending content. */
const REPO_TEMPLATE_SUFFIXES = [
  "fragrance-wheel",
  "blending-guide",
  "glossary",
  "formulas",
  "fragrance-oils",
  "labz-landing",
  "glossary-native",
  "empty",
  "about-us",
  "contact",
  "discord-embed",
]

function suffixToLabel(suffix: string): string {
  const labels: Record<string, string> = {
    "fragrance-wheel": "Fragrance Wheel (app embed)",
    "blending-guide": "Blending Lab (app embed)",
    glossary: "Glossary (app embed)",
    formulas: "Formulas (app embed)",
    "fragrance-oils": "Fragrance Oils (app embed)",
    "labz-landing": "MOOD LABZ Landing",
    "glossary-native": "Glossary (native metaobjects)",
  }
  return labels[suffix] ?? suffix.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

export default function StoreLabzPagesPage() {
  const [title, setTitle] = useState("")
  const [handle, setHandle] = useState("")
  const [templateSuffix, setTemplateSuffix] = useState("default")
  const [body, setBody] = useState("")
  const [isPublished, setIsPublished] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPage, setCreatedPage] = useState<{ id: string; title: string; handle: string } | null>(null)
  const [editingPage, setEditingPage] = useState<{
    id: number
    title: string
    handle: string
    body_html: string
    template_suffix: string | null
    published_at: string | null
  } | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editHandle, setEditHandle] = useState("")
  const [editBody, setEditBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [bulkCreating, setBulkCreating] = useState(false)
  const [bulkResult, setBulkResult] = useState<{
    created: number
    total: number
    results: Array<{ title: string; handle: string; success: boolean; error?: string }>
  } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    created: number
    updated: number
    total: number
    errors?: string[]
  } | null>(null)
  const [creatingGlossaryNative, setCreatingGlossaryNative] = useState(false)
  const [glossaryNativePage, setGlossaryNativePage] = useState<{ id: string; title: string; handle: string } | null>(null)
  const [pagesTablePage, setPagesTablePage] = useState(1)
  const [pagesSearchQuery, setPagesSearchQuery] = useState("")

  const { data: pagesData, isLoading, mutate } = useSWR(
    "/api/shopify/content?type=pages",
    fetcher,
    { revalidateOnFocus: false }
  )

  const { data: templatesData, isLoading: templatesLoading, mutate: mutateTemplates } = useSWR(
    "/api/shopify/theme/templates",
    fetcher,
    { revalidateOnFocus: false }
  )

  const themeSuffixes: string[] = templatesData?.suffixes ?? []
  const themeName = templatesData?.themeName ?? null
  const templateOptions = [
    { value: "default", label: "Default" },
    ...themeSuffixes.map((s) => ({ value: s, label: suffixToLabel(s) })),
  ]

  const pages = pagesData?.pages ?? []
  const count = pagesData?.count ?? pages.length

  const filteredPages = useMemo(() => {
    const q = pagesSearchQuery.trim().toLowerCase()
    if (!q) return pages
    return pages.filter(
      (p: { title?: string; handle?: string; template_suffix?: string | null; published_at?: string | null }) => {
        const title = (p.title ?? "").toLowerCase()
        const handle = (p.handle ?? "").toLowerCase()
        const template = (p.template_suffix ?? "default").toLowerCase()
        const status = p.published_at ? "published" : "draft"
        return title.includes(q) || handle.includes(q) || template.includes(q) || status.includes(q)
      }
    )
  }, [pages, pagesSearchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / PAGES_TABLE_PAGE_SIZE))
  const safePage = Math.min(Math.max(1, pagesTablePage), totalPages)
  const paginatedPages = filteredPages.slice(
    (safePage - 1) * PAGES_TABLE_PAGE_SIZE,
    safePage * PAGES_TABLE_PAGE_SIZE
  )
  const rangeStart = filteredPages.length === 0 ? 0 : (safePage - 1) * PAGES_TABLE_PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * PAGES_TABLE_PAGE_SIZE, filteredPages.length)

  useEffect(() => {
    if (pagesTablePage > totalPages && totalPages >= 1) {
      setPagesTablePage(totalPages)
    }
  }, [totalPages, pagesTablePage])

  useEffect(() => {
    setPagesTablePage(1)
  }, [pagesSearchQuery])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreatedPage(null)
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/shopify/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          handle: handle.trim() || undefined,
          templateSuffix: templateSuffix === "default" ? undefined : templateSuffix,
          body: body.trim() || undefined,
          isPublished,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }
      setCreatedPage(data.page)
      await mutate()
      setTitle("")
      setHandle("")
      setTemplateSuffix("default")
      setBody("")
      toast.success("Page created", { description: data.page?.title })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create page."
      setError(msg)
      toast.error("Create failed", { description: msg })
    } finally {
      setCreating(false)
    }
  }

  function handleCreateFragranceWheel() {
    setTitle("Fragrance Wheel")
    setHandle("fragrance-wheel")
    setTemplateSuffix("fragrance-wheel")
    setBody("")
    setIsPublished(true)
    setError(null)
    setCreatedPage(null)
  }

  async function handleBulkCreateLabzPages() {
    setError(null)
    setBulkResult(null)
    setBulkCreating(true)
    try {
      const res = await fetch("/api/shopify/labz-pages/bulk-create", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }
      setBulkResult({ created: data.created, total: data.total, results: data.results })
      await mutate()
      const failed = data.results?.filter((r: { success: boolean }) => !r.success) ?? []
      if (failed.length > 0) {
        toast.warning("Bulk create partial", {
          description: `Created ${data.created} of ${data.total}. ${failed.length} failed.`,
        })
      } else {
        toast.success("Bulk create complete", { description: `Created ${data.created} of ${data.total} pages.` })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bulk create failed."
      setError(msg)
      toast.error("Bulk create failed", { description: msg })
    } finally {
      setBulkCreating(false)
    }
  }

  async function handleSyncMetaobjectFragranceNotes() {
    setError(null)
    setSyncResult(null)
    setSyncing(true)
    try {
      const res = await fetch("/api/shopify/sync/metaobject-fragrance-notes", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? `Sync failed (${res.status})`)
      }
      setSyncResult({
        created: data.created ?? 0,
        updated: data.updated ?? 0,
        total: data.total ?? 0,
        errors: data.errors,
      })
      const desc = `Created ${data.created ?? 0}, updated ${data.updated ?? 0} of ${data.total ?? 0}.`
      if (data.errors?.length) {
        toast.warning("Synced fragrance notes to Shopify", { description: `${desc} Some errors occurred.` })
      } else {
        toast.success("Synced fragrance notes to Shopify", { description: desc })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed."
      setError(msg)
      toast.error("Sync failed", { description: msg })
    } finally {
      setSyncing(false)
    }
  }

  async function handleCreateGlossaryNativePage() {
    setError(null)
    setGlossaryNativePage(null)
    setCreatingGlossaryNative(true)
    try {
      const res = await fetch("/api/shopify/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Glossary (native)",
          handle: "glossary-native",
          templateSuffix: "glossary-native",
          isPublished: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Create failed")
      }
      setGlossaryNativePage(data.page)
      await mutate()
      toast.success("Glossary (native) page created", { description: `/pages/${data.page?.handle}` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Create failed."
      setError(msg)
      toast.error("Create failed", { description: msg })
    } finally {
      setCreatingGlossaryNative(false)
    }
  }

  async function handleUploadTemplate() {
    if (templateSuffix === "default") return
    setError(null)
    setUploading(true)
    try {
      const res = await fetch("/api/shopify/theme/templates/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suffix: templateSuffix }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed")
      }
      await mutateTemplates()
      toast.success("Template uploaded", { description: data.filename ?? `page.${templateSuffix}.json` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed."
      setError(msg)
      toast.error("Upload failed", { description: msg })
    } finally {
      setUploading(false)
    }
  }

  const canUploadFromRepo =
    templateSuffix !== "default" && REPO_TEMPLATE_SUFFIXES.includes(templateSuffix)
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || ""

  function openEdit(page: {
    id: number
    title: string
    handle: string
    body_html: string
    template_suffix: string | null
    published_at: string | null
  }) {
    setEditingPage(page)
    setEditTitle(page.title)
    setEditHandle(page.handle)
    setEditBody(page.body_html ?? "")
    setError(null)
  }

  async function handleSaveEdit() {
    if (!editingPage) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/shopify/pages/${editingPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          handle: editHandle.trim() || null,
          body: editBody,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Update failed")
      }
      await mutate()
      setEditingPage(null)
      toast.success("Page updated", { description: editTitle.trim() || editingPage.title })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed."
      setError(msg)
      toast.error("Update failed", { description: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          LABZ Pages
        </h1>
        <p className="text-sm text-muted-foreground">
          Create and manage Shopify storefront pages. Templates are read from your store&apos;s main theme; upload from repo when needed.
        </p>
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <strong className="text-foreground">Add MNKY LABZ to the main nav:</strong> In Shopify Admin go to{" "}
          <strong>Content → Menus → Main menu</strong>. Add a menu item &quot;MNKY LABZ&quot; (parent), then add &quot;Fragrance Wheel&quot; as a child linking to the page you created. See{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/SHOPIFY-LABZ-PAGES-AND-MENU.md</code> for details.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              Create page
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(creating || bulkCreating || uploading) && (
              <Progress indeterminate className="h-1.5 mb-4" />
            )}
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fragrance Wheel"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="handle">Handle (optional)</Label>
                <Input
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. fragrance-wheel"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  URL slug. Leave empty to generate from title.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={templateSuffix}
                  onValueChange={setTemplateSuffix}
                  disabled={templatesLoading}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder={templatesLoading ? "Loading…" : "Select template"} />
                  </SelectTrigger>
                  <SelectContent>
                    {templateOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {themeName != null
                    ? `From theme: ${themeName}. Use "Fragrance Wheel" for the app-embed page.`
                    : "Templates are loaded from the store's main theme (read_themes)."}
                </p>
                {canUploadFromRepo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadTemplate}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      `Upload page.${templateSuffix}.json from repo to theme`
                    )}
                  </Button>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="body">Body HTML (optional)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="<p>Static content...</p>"
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isPublished" className="font-normal cursor-pointer">
                  Publish immediately
                </Label>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {createdPage && (
                <p className="text-sm text-success">
                  Created: {createdPage.title} (/{createdPage.handle})
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create page in Shopify"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateFragranceWheel}
                  disabled={creating}
                >
                  Pre-fill Fragrance Wheel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBulkCreateLabzPages}
                  disabled={bulkCreating}
                >
                  {bulkCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create all LABZ pages"
                  )}
                </Button>
              </div>
              {bulkResult && (
                <p className="text-sm text-muted-foreground">
                  Created {bulkResult.created} of {bulkResult.total} pages.
                  {bulkResult.results.some((r) => !r.success) && (
                    <span className="block mt-1 text-destructive">
                      {bulkResult.results.filter((r) => !r.success).map((r) => `${r.title}: ${r.error}`).join("; ")}
                    </span>
                  )}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Existing pages
            </CardTitle>
            <Badge variant="secondary">{count}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <FileText className="h-8 w-8" />
                <p className="text-sm">No pages found</p>
              </div>
            ) : (
              <>
                <div className="px-4 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="search"
                      placeholder="Search by title, handle, template, or status…"
                      value={pagesSearchQuery}
                      onChange={(e) => setPagesSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-muted/50"
                      aria-label="Search existing pages"
                    />
                    {pagesSearchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setPagesSearchQuery("")}
                        aria-label="Clear search"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  {pagesSearchQuery.trim() && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {filteredPages.length} of {pages.length} page{pages.length === 1 ? "" : "s"} match
                    </p>
                  )}
                </div>
                <div className="min-h-[min(28rem,60vh)] flex flex-col border-t border-border">
                  <div className="overflow-auto flex-1 min-h-0 border-b border-border">
                    {filteredPages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 min-h-[min(26rem,56vh)] text-muted-foreground">
                        <Search className="h-8 w-8" />
                        <p className="text-sm">No pages match your search</p>
                        <Button variant="outline" size="sm" onClick={() => setPagesSearchQuery("")}>
                          Clear search
                        </Button>
                      </div>
                    ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Handle</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPages.map(
                        (page: {
                          id: number
                          title: string
                          handle: string
                          body_html?: string
                          template_suffix: string | null
                          published_at: string | null
                          updated_at: string
                        }) => (
                          <TableRow key={page.id}>
                            <TableCell className="text-sm font-medium text-foreground">
                              {page.title}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              /{page.handle}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {page.template_suffix ?? "default"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`text-[10px] border-0 ${
                                  page.published_at
                                    ? "bg-success/10 text-success"
                                    : "bg-warning/10 text-warning"
                                }`}
                              >
                                {page.published_at ? "Published" : "Draft"}
                              </Badge>
                            </TableCell>
                            <TableCell className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() =>
                                  openEdit({
                                    id: page.id,
                                    title: page.title,
                                    handle: page.handle,
                                    body_html: page.body_html ?? "",
                                    template_suffix: page.template_suffix,
                                    published_at: page.published_at,
                                  })
                                }
                                aria-label="Edit page"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {storeDomain && (
                                <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                                  <a
                                    href={`https://${storeDomain}/admin/pages/${page.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Open in Shopify Admin"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 bg-muted/30 shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {filteredPages.length === 0
                        ? "No results"
                        : `Showing ${rangeStart}–${rangeEnd} of ${filteredPages.length}`}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPagesTablePage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1 || filteredPages.length === 0}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[4rem] text-center text-xs text-muted-foreground">
                        {filteredPages.length === 0 ? "— / —" : `${safePage} / ${totalPages}`}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPagesTablePage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages || filteredPages.length === 0}
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Native glossary (metaobjects)
          </CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            Sync fragrance notes from Supabase to Shopify metaobjects for native Liquid pages. Then create the Glossary (native) page and optionally add it to the menu.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {(syncing || creatingGlossaryNative) && (
            <Progress indeterminate className="h-1.5" />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={handleSyncMetaobjectFragranceNotes}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync fragrance notes to Shopify
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCreateGlossaryNativePage}
              disabled={creatingGlossaryNative}
            >
              {creatingGlossaryNative ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Glossary (native) page"
              )}
            </Button>
          </div>
          {syncResult && (
            <Alert className="border-success/50 bg-success/5 [&>svg]:text-success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Sync complete</AlertTitle>
              <AlertDescription>
                Created {syncResult.created}, updated {syncResult.updated} of {syncResult.total} notes.
                {syncResult.total === 0 && (
                  <span className="block mt-1 text-muted-foreground">
                    No fragrance notes in Supabase to sync. Sync from Notion first: Full sync &amp; options → Note Glossary → To Supabase.
                  </span>
                )}
                {syncResult.errors?.length ? (
                  <span className="block mt-1 text-destructive">
                    {syncResult.errors.slice(0, 5).join("; ")}
                    {syncResult.errors.length > 5 ? ` (+${syncResult.errors.length - 5} more)` : ""}
                  </span>
                ) : null}
              </AlertDescription>
            </Alert>
          )}
          {glossaryNativePage && (
            <Alert className="border-success/50 bg-success/5 [&>svg]:text-success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Page created</AlertTitle>
              <AlertDescription>
                {glossaryNativePage.title} (/pages/{glossaryNativePage.handle}). Add it to Main menu in Shopify Admin if desired.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              Edit: {editingPage?.title ?? "Page"}
            </SheetTitle>
          </SheetHeader>
          {saving && <Progress indeterminate className="h-1.5 -mt-2" />}
          {editingPage && (
            <>
              <Tabs defaultValue="fields" className="flex flex-1 flex-col overflow-hidden">
                <TabsList>
                  <TabsTrigger value="fields">Fields</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="fields" className="mt-4 flex flex-col gap-4 overflow-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Page title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-handle">Handle</Label>
                    <Input
                      id="edit-handle"
                      value={editHandle}
                      onChange={(e) => setEditHandle(e.target.value)}
                      placeholder="url-slug"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-body">Body HTML</Label>
                    <Textarea
                      id="edit-body"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      placeholder="<p>Content...</p>"
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="mt-4 flex-1 overflow-auto">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none rounded-md border border-border bg-muted/30 p-4"
                    dangerouslySetInnerHTML={{ __html: editBody || "<p class=\"text-muted-foreground\">No content to preview.</p>" }}
                  />
                </TabsContent>
              </Tabs>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingPage(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
