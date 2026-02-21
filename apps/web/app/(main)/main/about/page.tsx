import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainFooter } from "../main-footer"

export const metadata = {
  title: "About – MOOD MNKY",
  description: "Learn about MOOD MNKY, bespoke fragrance, and the MNKY VERSE community.",
}

export default function MainAboutPage() {
  return (
    <>
      <header className="main-container border-b py-4">
        <nav className="flex items-center justify-between" aria-label="Main navigation">
          <Link href="/main" className="text-lg font-semibold text-foreground hover:text-primary">
            MOOD MNKY
          </Link>
          <div className="flex gap-4">
            <Link href="/main/about" className="text-sm font-medium text-foreground">
              About
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
          About MOOD MNKY
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          MOOD MNKY brings together bespoke fragrance, community, and innovation
          in the MNKY VERSE. Explore our blending lab, fragrance wheel, and
          member portal.
        </p>
        <Button asChild className="mt-6">
          <Link href="/verse">Join MNKY VERSE</Link>
        </Button>
      </main>

      <MainFooter />
    </>
  )
}
