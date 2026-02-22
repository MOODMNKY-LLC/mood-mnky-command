import Link from "next/link"
import { MainNav, MainFooter } from "@/components/main"
import { ComponentLibraryContent } from "@/components/main/component-library-content"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"

export const metadata = {
  title: "Component Library – MOOD MNKY",
  description:
    "UI component showcase: ElevenLabs, shadcn, Magic UI, and more. Preview and copy code.",
}

export default function ComponentLibraryPage() {
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
              Component Library
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Preview and copy code for UI components used across MOOD MNKY—ElevenLabs, shadcn, Magic UI, and others. Use the Preview and Code tabs to see each component and its usage.
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
