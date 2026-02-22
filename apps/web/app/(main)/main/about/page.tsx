import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav, MainGlassCard, MainFooter, MainFounderCard } from "@/components/main"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"

export const metadata = {
  title: "About – MOOD MNKY",
  description:
    "Learn about MOOD MNKY, bespoke fragrance, and the MNKY VERSE community.",
}

export default function MainAboutPage() {
  return (
    <>
      <MainNav />

      <main className="main-container py-12 md:py-16">
        <div className="mb-8 flex justify-center">
          <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-border md:h-56 md:w-56">
            <MainMascotImage
              src={MAIN_MASCOT_ASSETS.about}
              alt="MOOD MNKY – About"
              fill
              className="object-cover object-center"
              hideOnError
            />
          </div>
        </div>
        <MainGlassCard className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            About MOOD MNKY
          </h1>
          <p className="mt-4 text-muted-foreground">
            MOOD MNKY is a technological organism that integrates physical
            products, digital experiences, and AI-driven personalization to
            transform self-care from a routine task into a meaningful,
            personalized journey.
          </p>
          <p className="mt-4 text-muted-foreground">
            We bring together bespoke fragrance, community, and innovation in
            the MNKY VERSE. Explore our blending lab, fragrance wheel, and
            member portal.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/verse">Join MNKY VERSE</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/verse/blending-guide">Blending Guide</Link>
            </Button>
          </div>
        </MainGlassCard>

        <section className="mt-12 max-w-2xl">
          <MainFounderCard />
        </section>
      </main>

      <MainFooter />
    </>
  )
}
