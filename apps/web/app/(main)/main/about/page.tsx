import { MainNav, MainFooter, MainAboutSplitSection } from "@/components/main"
import { MAIN_ABOUT_BRAND } from "@/lib/main-about-data"

export const metadata = {
  title: "About – MOOD MNKY",
  description: MAIN_ABOUT_BRAND.metaDescription,
}

export default function MainAboutPage() {
  return (
    <>
      <MainNav />

      <main className="main-container py-12 md:py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          About us
        </h1>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          The founder and his brain child: the people and the brand behind MOOD MNKY.
        </p>
        <MainAboutSplitSection />
      </main>

      <MainFooter />
    </>
  )
}
