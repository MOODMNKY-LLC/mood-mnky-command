import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav, MainGlassCard, MainFooter } from "@/components/main"

export const metadata = {
  title: "Pricing – MOOD MNKY",
  description: "Explore MOOD MNKY and the Dojo offerings.",
}

export default function MainPricingPage() {
  return (
    <>
      <MainNav />

      <main className="main-container py-12 md:py-16">
        <MainGlassCard className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Pricing
          </h1>
          <p className="mt-4 text-muted-foreground">
            Discover products and membership in the Dojo. We offer
            accessible premium experiences through engagement-based
            alternatives—subscribe and save on refills. Always scentsing the MOOD.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/dojo">Shop in the Dojo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dojo/blending-guide">Blending Lab</Link>
            </Button>
          </div>
        </MainGlassCard>
      </main>

      <MainFooter />
    </>
  )
}
