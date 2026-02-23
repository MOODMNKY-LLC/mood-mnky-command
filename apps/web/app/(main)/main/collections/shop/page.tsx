"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav, MainFooter, MainGlassCard } from "@/components/main"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, ShoppingBag } from "lucide-react"

const COLLECTIONS_FEATURES = [
  "List collections from Shopify (Storefront API or LABZ-backed API).",
  "Grid of collection cards with image, title, and product count.",
  "Link to collection pages or MNKY VERSE.",
  "Optional filters (e.g. by product type).",
]

interface ShopifyCollectionItem {
  id: number
  title: string
  handle: string
  image?: { src: string; alt: string | null } | null
  products_count?: number
}

export default function MainCollectionsShopPage() {
  const [collections, setCollections] = useState<ShopifyCollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch("/api/shopify/collections")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 503 ? "Shopify is not configured." : "Failed to load collections.")
        return r.json()
      })
      .then((data: { collections?: ShopifyCollectionItem[]; error?: string }) => {
        if (cancelled) return
        if (data.error) throw new Error(data.error)
        setCollections(Array.isArray(data.collections) ? data.collections : [])
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

  if (loading) {
    return (
      <>
        <MainNav />
        <main className="main-container py-12 md:py-16">
          <div className="mx-auto max-w-4xl space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Shop
              </h1>
              <p className="mt-2 text-muted-foreground">Loading collections…</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <MainFooter />
      </>
    )
  }

  if (error || collections.length === 0) {
    return (
      <>
        <MainNav />
        <main className="main-container py-12 md:py-16">
          <div className="mx-auto max-w-2xl space-y-10">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border sm:h-28 sm:w-28">
                <MainMascotImage
                  src={MAIN_MASCOT_ASSETS.collections}
                  alt="MOOD MNKY – Shop"
                  fill
                  className="object-cover object-center"
                  hideOnError
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Shop
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {error ?? "Shopify collections will be displayed here."}
                </p>
              </div>
              <MainGlassCard className="main-glass-panel-card w-full text-left">
                <p className="text-sm font-medium text-foreground">
                  This page is under construction. We're building a dedicated view
                  of our Shopify collections with the following features:
                </p>
                <ul className="mt-4 space-y-2">
                  {COLLECTIONS_FEATURES.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </MainGlassCard>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link href="/verse">Shop MNKY VERSE</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/main/collections">Back to collections</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <MainFooter />
      </>
    )
  }

  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Shop
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse by collection. Shop in MNKY VERSE.
            </p>
          </header>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {collections.map((col) => (
              <Link key={col.id} href={`/verse/collections/${col.handle}`}>
                <MainGlassCard className="main-float main-glass-panel-card flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
                    {col.image?.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={col.image.src}
                        alt={col.image.alt ?? col.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-end p-4">
                    <h2 className="font-semibold text-foreground line-clamp-2">
                      {col.title}
                    </h2>
                    {col.products_count != null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {col.products_count} product
                        {col.products_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </MainGlassCard>
              </Link>
            ))}
          </div>
          <div className="flex justify-center pt-4">
            <Button asChild variant="outline">
              <Link href="/verse">Shop all in MNKY VERSE</Link>
            </Button>
          </div>
        </div>
      </main>
      <MainFooter />
    </>
  )
}
