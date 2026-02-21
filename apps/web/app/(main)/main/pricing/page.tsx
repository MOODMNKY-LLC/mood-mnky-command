import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainFooter } from "../main-footer"

export const metadata = {
  title: "Pricing – MOOD MNKY",
  description: "Explore MOOD MNKY and MNKY VERSE offerings.",
}

export default function MainPricingPage() {
  return (
    <>
      <header className="main-container border-b py-4">
        <nav className="flex items-center justify-between" aria-label="Main navigation">
          <Link href="/main" className="text-lg font-semibold text-foreground hover:text-primary">
            MOOD MNKY
          </Link>
          <div className="flex gap-4">
            <Link href="/main/about" className="text-sm text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href="/main/pricing" className="text-sm font-medium text-foreground">
              Pricing
            </Link>
            <Link href="/verse" className="text-sm text-muted-foreground hover:text-foreground">
              MNKY VERSE
            </Link>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <main className="main-container py-12 md:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Pricing
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Discover products and membership in the MNKY VERSE. Shop and explore
          the blending lab.
        </p>
        <Button asChild className="mt-6">
          <Link href="/verse">Shop in MNKY VERSE</Link>
        </Button>
      </main>

      <MainFooter />
    </>
  )
}
