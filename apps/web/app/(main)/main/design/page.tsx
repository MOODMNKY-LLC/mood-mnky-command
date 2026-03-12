import Link from "next/link"
import { MainNav, MainFooter } from "@/components/main"
import { ComponentLibraryContent } from "@/components/main/component-library-content"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"

export const metadata = {
  title: "Design Tokens – MOOD MNKY",
  description:
    "Design tokens of the MOOD MNKY virtual universe: voice, visual, and layout primitives used across Main, Dojo, and MNKY LABZ.",
}

export default function DesignTokensPage() {
  return (
    <>
      <MainNav />
      <main className="main-container w-full max-w-[1600px] mx-auto py-12 md:py-16 px-4">
        <div className="mb-12 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <VerseLogoHairIcon
              withRing
              size="lg"
              className="text-foreground"
              ringClassName="border-foreground/80"
            />
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Design tokens
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Reusable design tokens and UI primitives that define the MOOD MNKY virtual universe—voice and conversation, visuals, and layout. Use the filters and collapsible sections to explore.
          </p>
          <Link
            href="/main"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Main
          </Link>
        </div>
        <ComponentLibraryContent />
      </main>
      <MainFooter />
    </>
  )
}
