"use client"

import { useSearchParams } from "next/navigation"
import { useMemo, useEffect, useState } from "react"
import Link from "next/link"
import { MainNav, MainFooter, MnkyFragranceCard, MainGlassCard } from "@/components/main"
import { Skeleton } from "@/components/ui/skeleton"
import type { FragranceOil } from "@/lib/types"
import type { Formula } from "@/lib/types"
import { FORMULA_CATEGORY_LABELS } from "@/lib/types"
import { FlaskConical } from "lucide-react"

function matchQuery(text: string, q: string): boolean {
  if (!q.trim()) return true
  const lower = text.toLowerCase()
  const terms = q.toLowerCase().trim().split(/\s+/)
  return terms.every((t) => lower.includes(t))
}

export default function MainSearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? ""

  const [oils, setOils] = useState<FragranceOil[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      fetch("/api/fragrance-oils").then((r) => r.json()),
      fetch("/api/formulas").then((r) => r.json()),
    ])
      .then(([oilRes, formulaRes]) => {
        if (cancelled) return
        if (oilRes.fragranceOils) setOils(oilRes.fragranceOils)
        if (formulaRes.formulas) setFormulas(formulaRes.formulas)
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
  }, [])

  const filteredOils = useMemo(() => {
    if (!q.trim()) return oils
    return oils.filter(
      (oil) =>
        matchQuery(oil.name, q) ||
        matchQuery(oil.description, q) ||
        matchQuery(oil.family, q) ||
        oil.subfamilies.some((f) => matchQuery(f, q)) ||
        oil.topNotes.some((n) => matchQuery(n, q)) ||
        oil.middleNotes.some((n) => matchQuery(n, q)) ||
        oil.baseNotes.some((n) => matchQuery(n, q))
    )
  }, [oils, q])

  const filteredFormulas = useMemo(() => {
    if (!q.trim()) return formulas
    return formulas.filter(
      (f) =>
        matchQuery(f.name, q) ||
        matchQuery(f.description, q) ||
        (f.tags && f.tags.some((t) => matchQuery(t, q)))
    )
  }, [formulas, q])

  const hasResults = filteredOils.length > 0 || filteredFormulas.length > 0
  const hasQuery = q.length > 0

  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Search
          </h1>
          <p className="mt-2 text-muted-foreground">
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
                              {formula.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {formula.description}
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
