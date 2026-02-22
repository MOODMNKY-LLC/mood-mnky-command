import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav, MainFooter, MainGlassCard } from "@/components/main"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"
import { Construction, CheckCircle2 } from "lucide-react"

const COLLECTIONS_FEATURES = [
  "List collections from Shopify (Storefront API or LABZ-backed API).",
  "Grid of collection cards with image, title, and product count.",
  "Link to collection pages or MNKY VERSE.",
  "Optional filters (e.g. by product type).",
]

export const metadata = {
  title: "Collections – MOOD MNKY",
  description: "Shopify collections will be displayed here. Coming soon.",
}

export default function MainCollectionsPage() {
  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mx-auto max-w-2xl space-y-10">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border sm:h-28 sm:w-28">
              <MainMascotImage
                src={MAIN_MASCOT_ASSETS.collections}
                alt="MOOD MNKY – Collections"
                fill
                className="object-cover object-center"
                hideOnError
              />
            </div>
            <div className="main-glass-panel-card flex h-24 w-24 items-center justify-center rounded-full">
              <Construction className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Collections
              </h1>
              <p className="mt-2 text-muted-foreground">
                Shopify collections will be displayed here.
              </p>
            </div>
            <MainGlassCard className="main-glass-panel-card w-full text-left">
              <p className="text-sm font-medium text-foreground">
                This page is under construction. We’re building a dedicated view
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
                <Link href="/main">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <MainFooter />
    </>
  )
}
