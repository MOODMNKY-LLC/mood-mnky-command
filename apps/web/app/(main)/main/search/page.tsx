"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { MainNav, MainFooter, MnkyFragranceCard, MainGlassCard } from "@/components/main"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FragranceOil } from "@/lib/types"
import type { Formula } from "@/lib/types"
import { FORMULA_CATEGORY_LABELS } from "@/lib/types"
import { FlaskConical, Search } from "lucide-react"

const DEBOUNCE_MS = 350
type FilterType = "all" | "fragrances" | "formulas"

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!text || !query.trim()) return text
  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return text
  const parts: React.ReactNode[] = []
  let remaining = text
  const combined = new RegExp(
    terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "gi"
  )
  let match = combined.exec(remaining)
  while (match) {
    if (match.index > 0) parts.push(remaining.slice(0, match.index))
    parts.push(
      <mark key={parts.length} className="rounded bg-primary/20 font-medium text-foreground">
        {match[0]}
      </mark>
    )
    remaining = remaining.slice(match.index + match[0].length)
    combined.lastIndex = 0
    match = combined.exec(remaining)
  }
  if (remaining) parts.push(remaining)
  return parts.length > 0 ? <>{parts}</> : text
}

export default function MainSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get("q") ?? ""

  const [inputValue, setInputValue] = useState(q)
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [oils, setOils] = useState<FragranceOil[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInputValue(q)
  }, [q])

  useEffect(() => {
    const trimmed = inputValue.trim()
    if (trimmed === q) return
    const t = setTimeout(() => {
      if (trimmed) {
        router.push(`/main/search?q=${encodeURIComponent(trimmed)}`)
      } else {
        router.push("/main/search")
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [inputValue, router, q])

  useEffect(() => {
    if (!q.trim()) {
      setOils([])
      setFormulas([])
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/main/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setOils(data.fragranceOils ?? [])
        setFormulas(data.formulas ?? [])
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [q])

  const filteredOils = filterType === "formulas" ? [] : oils
  const filteredFormulas = filterType === "fragrances" ? [] : formulas
  const hasResults = filteredOils.length > 0 || filteredFormulas.length > 0
  const hasQuery = q.length > 0

  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mb-10 space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Search
          </h1>
          <div className="main-glass-panel main-float flex max-w-xl items-center gap-2 rounded-xl border border-border px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search fragrances, formulas, and more…"
              className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              aria-label="Search fragrances and formulas"
            />
          </div>
          {hasQuery && (
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="fragrances">Fragrances</TabsTrigger>
                <TabsTrigger value="formulas">Formulas</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <p className="text-muted-foreground">
            {hasQuery
              ? `Results for “${q}”`
              : "Search fragrances and formulas below."}
          </p>
        </div>

        {error && (
          <MainGlassCard className="border-destructive/50 text-destructive">
            {error}
          </MainGlassCard>
        )}

        {loading ? (
          <div className="space-y-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          </div>
        ) : !hasQuery ? (
          <p className="text-muted-foreground">
            Enter a search term in the header to find fragrances and formulas.
          </p>
        ) : !hasResults ? (
          <MainGlassCard className="main-glass-panel-card">
            <p className="text-muted-foreground">
              No fragrances or formulas matched “{q}”. Try a different term or
              browse <Link href="/main/fragrances" className="text-primary underline">Fragrances</Link> or{" "}
              <Link href="/main/formulas" className="text-primary underline">Formulas</Link>.
            </p>
          </MainGlassCard>
        ) : (
          <div className="space-y-12">
            {filteredOils.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Fragrances ({filteredOils.length})
                </h2>
                <div className="flex flex-wrap gap-6">
                  {filteredOils.map((oil) => (
                    <MnkyFragranceCard key={oil.id} oil={oil} withDialog />
                  ))}
                </div>
              </section>
            )}
            {filteredFormulas.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Formulas ({filteredFormulas.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredFormulas.map((formula) => (
                    <Link
                      key={formula.id}
                      href="/main/formulas"
                      className="block"
                    >
                      <MainGlassCard className="main-float main-glass-panel-card flex flex-col gap-2 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FlaskConical className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {highlightQuery(formula.name, q)}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {highlightQuery(formula.description ?? "", q)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formula.categoryId
                            ? FORMULA_CATEGORY_LABELS[formula.categoryId]
                            : formula.productType}
                          {" · "}
                          {formula.phases.length} phases
                        </span>
                      </MainGlassCard>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <MainFooter />
    </>
  )
}
