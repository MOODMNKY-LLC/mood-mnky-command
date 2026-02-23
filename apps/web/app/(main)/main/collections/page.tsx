"use client"

import Link from "next/link"
import { MainNav, MainFooter, MainGlassCard } from "@/components/main"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"
import { ShoppingBag, FlaskConical, Sparkles } from "lucide-react"

const COLLECTION_SECTIONS = [
  {
    href: "/main/collections/shop",
    label: "Shop",
    description: "Browse our Shopify collections. Shop in MNKY VERSE.",
    icon: ShoppingBag,
    mascot: MAIN_MASCOT_ASSETS.collections,
  },
  {
    href: "/main/collections/fragrances",
    label: "Fragrances",
    description: "Explore our fragrance oil library. Create your own scent in the Blending Lab.",
    icon: Sparkles,
    mascot: MAIN_MASCOT_ASSETS.fragrances,
  },
  {
    href: "/main/collections/formulas",
    label: "Formulas",
    description: "Browse and calculate formulations for bath, body, and cosmetic products.",
    icon: FlaskConical,
    mascot: MAIN_MASCOT_ASSETS.formulas,
  },
] as const

export default function MainCollectionsPage() {
  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-10">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Collections
            </h1>
            <p className="mt-2 text-muted-foreground">
              Shop the store, explore fragrances, or browse formulas.
            </p>
          </header>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTION_SECTIONS.map(({ href, label, description, icon: Icon, mascot }) => (
              <Link key={href} href={href}>
                <MainGlassCard className="main-float main-glass-panel-card flex h-full flex-col overflow-hidden transition-colors hover:border-border">
                  <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted/20">
                    <MainMascotImage
                      src={mascot}
                      alt={`MOOD MNKY – ${label}`}
                      fill
                      className="object-cover object-center opacity-90"
                      hideOnError
                    />
                    <div className="absolute bottom-3 right-3 rounded-lg border border-border bg-background/80 p-2">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-semibold text-foreground">{label}</h2>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  </div>
                </MainGlassCard>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <MainFooter />
    </>
  )
}
