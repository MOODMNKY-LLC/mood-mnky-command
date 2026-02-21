import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BlurFade } from "@/components/ui/blur-fade"
import { MainFooter } from "./main-footer"

export default function MainLandingPage() {
  return (
    <>
      <header className="main-container border-b py-4">
        <nav className="flex items-center justify-between" aria-label="Main navigation">
          <Link
            href="/main"
            className="text-lg font-semibold text-foreground hover:text-primary"
          >
            MOOD MNKY
          </Link>
          <div className="flex gap-4">
            <Link
              href="/main/about"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/verse"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              MNKY VERSE
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <main className="main-container py-12 md:py-20">
        <BlurFade delay={0.1} inView inViewMargin="-20px">
          <section className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Fragrance, Community, Innovation
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Bespoke fragrance and the MNKY VERSE. Explore our community,
              blending lab, and fragrance oils.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/verse">Join MNKY VERSE</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/verse/fragrance-wheel">Fragrance Wheel</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
          </section>
        </BlurFade>

        <BlurFade delay={0.2} inView inViewMargin="-20px">
          <section className="mt-20 grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <h2 className="text-xl font-semibold">MNKY VERSE</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Community and member portal. Shop, explore the blending guide,
                and connect.
              </p>
              <Button asChild className="mt-4">
                <Link href="/verse">Explore VERSE</Link>
              </Button>
            </div>
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <h2 className="text-xl font-semibold">Blending Lab</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Formula calculator and fragrance tools for creators and
                members.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/verse/blending-guide">Blending Guide</Link>
              </Button>
            </div>
          </section>
        </BlurFade>
      </main>

      <MainFooter />
    </>
  )
}
