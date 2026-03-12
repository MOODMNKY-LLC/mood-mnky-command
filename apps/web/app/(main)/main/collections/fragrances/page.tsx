"use client"

import { useState, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import {
  MainNav,
  MainFooter,
  MnkyFragranceCard,
  MainGlassCard,
  MainFragranceCarousel,
  FeaturedFragranceCard,
} from "@/components/main"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { FragranceOil } from "@/lib/types"
import { FRAGRANCE_FAMILIES } from "@/lib/types"

const SEARCH_DEBOUNCE_MS = 280

export default function MainCollectionsFragrancesPage() {
  const [oils, setOils] = useState<FragranceOil[]>([])
  const [featuredFragrances, setFeaturedFragrances] = useState<FragranceOil[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [familyFilter, setFamilyFilter] = useState<string>("all")

  const fetchOils = useCallback(async (query: string) => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    const res = await fetch(`/api/fragrance-oils?${params.toString()}`)
    const data = await res.json()
    setOils(data.fragranceOils ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/fragrance-oils").then((r) => r.json()),
      fetch("/api/main/featured-fragrances").then((r) => r.json()),
    ]).then(([oilRes, featuredRes]) => {
      if (cancelled) return
      setOils(oilRes.fragranceOils ?? [])
      setFeaturedFragrances(featuredRes.featuredFragrances ?? [])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (loading) return
    const t = setTimeout(() => {
      fetchOils(search)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search, fetchOils, loading])

  const filtered = oils.filter((oil) => {
    const matchFamily =
      familyFilter === "all" || oil.family === familyFilter
    return matchFamily
  })

  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border sm:h-28 sm:w-28">
            <MainMascotImage
              src={MAIN_MASCOT_ASSETS.fragrances}
              alt="MOOD MNKY – Fragrances"
              fill
              className="object-cover object-center"
              hideOnError
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Fragrances
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Explore our fragrance oil library. Use the Blending Lab in the Dojo
              to create your own scent.
            </p>
          </div>
        </div>

        {featuredFragrances.length > 0 && (
          <>
            <section className="mb-8">
              <FeaturedFragranceCard oil={featuredFragrances[0]} />
            </section>
            {featuredFragrances.length > 1 && (
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-foreground">More featured</h2>
                <MainFragranceCarousel oils={featuredFragrances} />
              </section>
            )}
          </>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or family…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="main-glass-panel pl-9"
            />
          </div>
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="main-glass-panel h-10 rounded-md border border-border bg-background/80 px-3 text-sm text-foreground"
            aria-label="Filter by family"
          >
            <option value="all">All families</option>
            {FRAGRANCE_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex flex-wrap gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[280px] w-[200px] rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <MainGlassCard className="main-glass-panel-card">
            <p className="text-muted-foreground">
              No fragrances match your filters. Try a different search or family.
            </p>
          </MainGlassCard>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {filtered.map((oil) => (
              <MnkyFragranceCard key={oil.id} oil={oil} withDialog />
            ))}
          </div>
        )}
      </main>
      <MainFooter />
    </>
  )
}
