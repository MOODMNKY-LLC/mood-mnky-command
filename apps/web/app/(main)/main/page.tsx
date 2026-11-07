import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BlurFade } from "@/components/ui/blur-fade"
import {
  MainNav,
  MainOnboardingBanner,
  MainHeroSplit,
  MainFeatureCards,
  MainSocialProof,
  MainCustomization,
  MainGlassCard,
  MainFragranceCarousel,
  MainWaitlistForm,
  MainCustomizationAgentsSplit,
  MainFooter,
} from "@/components/main"
import { MainScentShowcase } from "@/components/main/main-scent-showcase"
import {
  getMainLandingData,
  getMainAgents,
  getMainFeaturedFragrances,
  getMainElevenLabsConfig,
} from "@/lib/main-landing-data"

export default async function MainLandingPage() {
  const [landingData, agents, featuredFragrances, elevenLabsConfig] = await Promise.all([
    getMainLandingData(),
    getMainAgents(),
    getMainFeaturedFragrances(),
    getMainElevenLabsConfig(),
  ])

  return (
    <>
      <MainNav />
      <MainOnboardingBanner />

      <main className="main-container w-full py-12 md:py-16">
        {/* Hero: full-width */}
        <section className="col-span-full">
          <MainHeroSplit />
        </section>

        {/* Bento-style grid: 1 col mobile, 2–3 cols desktop */}
        <div
          className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
          style={{ marginTop: "var(--main-section-gap)" }}
        >
          <section className="col-span-full">
            <MainFeatureCards items={landingData.features} />
          </section>
          <section className="col-span-full">
            <MainSocialProof items={landingData.socialProof} />
          </section>
          <section className="col-span-full">
            <MainCustomization />
          </section>

          {/* FAQ (left) | Meet the Agents in frosted panel (right) */}
          <MainCustomizationAgentsSplit
            agents={agents}
            config={{
              showVoiceSection: elevenLabsConfig.showVoiceSection,
              showAudioSample: elevenLabsConfig.showAudioSample,
              audioSampleUrl: elevenLabsConfig.audioSampleUrl,
            }}
            faqItems={landingData.faq}
          />

        {/* Featured fragrances – live catalog when available; else source brand scent/vessel art */}
        {featuredFragrances.length > 0 ? (
          <BlurFade delay={0.16} inView inViewMargin="-20px" className="col-span-full">
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  MNKY Science
                </h2>
                <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
                  A few fragrances from our library—explore the full collection
                  in the Blending Lab.
                </p>
              </div>
              <MainFragranceCarousel oils={featuredFragrances} />
            </section>
          </BlurFade>
        ) : (
          <MainScentShowcase />
        )}

        {/* Explore – public guide + intended Dojo gate (honest destinations) */}
        <BlurFade delay={0.17} inView inViewMargin="-20px" className="col-span-full">
          <section className="grid gap-6 md:grid-cols-2">
            <MainGlassCard className="flex flex-col">
              <h2 className="text-xl font-semibold text-foreground">
                The Dojo
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                Live member hub requires a real signed-in account. For preview,
                use the illustrative review journey — no fake credentials.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/review">Review journey</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dojo">Explore Dojo</Link>
                </Button>
              </div>
            </MainGlassCard>
            <MainGlassCard className="flex flex-col">
              <h2 className="text-xl font-semibold text-foreground">
                Blending Lab
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                Public blending guide and fragrance wheel — no sign-in required.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/dojo/blending-guide">Blending Guide</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dojo/fragrance-wheel">Fragrance Wheel</Link>
                </Button>
              </div>
            </MainGlassCard>
          </section>
        </BlurFade>

        {/* Waitlist – slim banner above footer */}
        <BlurFade delay={0.18} inView inViewMargin="-20px" className="col-span-full">
          <section className="border-t border-border pt-12">
            <div className="mx-auto max-w-xl">
              <MainWaitlistForm />
            </div>
          </section>
        </BlurFade>
        </div>
      </main>

      <MainFooter />
    </>
  )
}
